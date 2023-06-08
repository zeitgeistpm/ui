import { useQuery } from "@tanstack/react-query";
import {
  parseAssetId,
  getMarketIdOf,
  isIndexedSdk,
  IOMarketOutcomeAssetId,
} from "@zeitgeistpm/sdk-next";
import mergeSortedArrays from "lib/util/merge-sorted-arrays";
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
    historicalAssets(
      where: {
        accountId_eq: $address
        event_in: ["PoolCreate", "PoolJoin", "PoolExit"]
      }
      orderBy: timestamp_DESC
    ) {
      assetId
      timestamp
      event
      blockNumber
    }
    historicalAccountBalances(
      where: { accountId_eq: $address, event_eq: "TokensRedeemed" }
      orderBy: timestamp_DESC
    ) {
      assetId
      event
      timestamp
      blockNumber
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

type Action = typeof humanReadableEventMap[keyof typeof humanReadableEventMap];

export type TradeEvent = {
  marketId: number;
  question: string;
  action: Action;
  time: string;
  blockNumber: number;
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
};

export const useTransactionHistory = (address: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, transactionHistoryKey, address],
    async () => {
      if (isIndexedSdk(sdk) && address) {
        const { historicalAssets, historicalAccountBalances } =
          await sdk.indexer.client.request<{
            historicalAssets: EventEntry[];
            historicalAccountBalances: EventEntry[];
          }>(transactionHistoryQuery, {
            address: address,
          });

        const merged = mergeSortedArrays<EventEntry, "blockNumber">(
          "blockNumber",
          historicalAccountBalances,
          historicalAssets,
        );

        let transactions: TradeEvent[] = [];

        const marketIds = new Set<number>(
          merged.map((event) => {
            const assetId = parseAssetId(event.assetId).unwrap();

            return IOMarketOutcomeAssetId.is(assetId)
              ? getMarketIdOf(assetId)
              : null;
          }),
        );

        const { markets } = await sdk.indexer.client.request<{
          markets: MarketHeader[];
        }>(marketHeaderQuery, {
          marketIds: Array.from(marketIds),
        });

        const marketsMap: Map<number, MarketHeader> = new Map();
        marketIds.forEach((marketId) => {
          const market = markets.find((m) => m.marketId === marketId);
          if (!market) return;
          marketsMap.set(marketId, market);
        });

        for (const item of merged) {
          const action: Action = humanReadableEventMap[item.event];
          const assetId = parseAssetId(item.assetId).unwrap();
          const marketId = IOMarketOutcomeAssetId.is(assetId)
            ? getMarketIdOf(assetId)
            : null;

          transactions = [
            ...transactions,
            {
              marketId: marketId,
              question: marketsMap.get(marketId).question,
              action: action,
              time: item.timestamp,
              blockNumber: item.blockNumber,
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
