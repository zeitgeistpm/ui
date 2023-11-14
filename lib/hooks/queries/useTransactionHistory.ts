import { useQuery } from "@tanstack/react-query";
import {
  parseAssetId,
  getMarketIdOf,
  isIndexedSdk,
  IOMarketOutcomeAssetId,
} from "@zeitgeistpm/sdk";
import { gql } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const transactionHistoryKey = "transaction-history";

const humanReadableEventMap = {
  PoolCreate: "Create Pool",
  PoolExit: "Remove Liquidity",
  PoolJoin: "Add Liquidity",
  TokensRedeemed: "Redeemed Tokens",
} as const;

const transactionHistoryQuery = gql`
  query TransactionHistory($address: String) {
    historicalAccountBalances(
      where: {
        accountId_eq: $address
        event_in: ["PoolCreate", "PoolJoin", "PoolExit", "TokensRedeemed"]
      }
      orderBy: timestamp_DESC
    ) {
      assetId
      event
      timestamp
      blockNumber
      extrinsic {
        hash
        name
      }
    }
  }
`;

const marketHeaderQuery = gql`
  query MarketTransactionHeader($marketIds: [Int!]) {
    markets(where: { marketId_in: $marketIds }, orderBy: marketId_ASC) {
      question
      marketId
    }
  }
`;

type Action =
  (typeof humanReadableEventMap)[keyof typeof humanReadableEventMap];

export type TradeEvent = {
  marketId: number;
  question: string;
  action: Action;
  time: string;
  blockNumber: number;
  extrinsic: {
    hash: string;
    name: string;
  };
};

type MarketHeader = {
  question: string;
  marketId: number;
};

type EventEntry = {
  assetId: string;
  timestamp: string;
  event: string;
  blockNumber: number;
  extrinsic: {
    hash: string;
    name: string;
  };
};

export const useTransactionHistory = (address: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, transactionHistoryKey, address],
    async () => {
      if (isIndexedSdk(sdk) && address) {
        const { historicalAccountBalances } = await sdk.indexer.client.request<{
          historicalAssets: EventEntry[];
          historicalAccountBalances: EventEntry[];
        }>(transactionHistoryQuery, {
          address: address,
        });

        const merged = [...historicalAccountBalances].sort((a, b) => {
          return b.blockNumber - a.blockNumber;
        });

        let transactions: TradeEvent[] = [];

        const marketIds = new Set<number>();

        for (const event of merged) {
          const assetId = parseAssetId(event.assetId).unwrap();

          if (!IOMarketOutcomeAssetId.is(assetId)) {
            continue;
          }
          const marketId = getMarketIdOf(assetId);
          marketIds.add(marketId);
        }

        const { markets } = await sdk.indexer.client.request<{
          markets: MarketHeader[];
        }>(marketHeaderQuery, {
          marketIds: Array.from(marketIds),
        });

        const marketsMap: Record<number, MarketHeader> = {};

        marketIds.forEach((marketId) => {
          const market = markets.find((m) => m.marketId === marketId);
          if (!market) return;
          marketsMap[marketId] = market;
        });

        for (const item of merged) {
          const action: Action = humanReadableEventMap[item.event];
          const assetId = parseAssetId(item.assetId).unwrap();
          if (!IOMarketOutcomeAssetId.is(assetId)) {
            continue;
          }
          const marketId = getMarketIdOf(assetId);

          transactions = [
            ...transactions,
            {
              marketId: marketId,
              question: marketsMap[marketId].question,
              action: action,
              time: item.timestamp,
              blockNumber: item.blockNumber,
              extrinsic: item.extrinsic,
            },
          ];
        }

        return transactions;
      }
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isIndexedSdk(sdk) && address),
    },
  );

  return query;
};
