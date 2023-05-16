import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  parseAssetId,
  getMarketIdOf,
  isIndexedSdk,
  IOMarketOutcomeAssetId,
} from "@zeitgeistpm/sdk-next";
import { gql } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const transactionHistoryKey = "transaction-history";

const transactionHistoryQuery = gql`
  query TransactionHistory($address: String) {
    historicalAssets(
      where: {
        accountId_eq: $address
        AND: { event_not_contains: "SwapExact" }
      }
      orderBy: timestamp_DESC
    ) {
      assetId
      baseAssetTraded
      timestamp
      event
      blockNumber
    }
  }
`;

const marketHeaderQuery = gql`
  query MarketTransactionHeader($marketIds: [Int!]) {
    markets(where: { marketId_in: $marketIds }, orderBy: marketId_ASC) {
      question
    }
  }
`;

const humanReadableEventMap = {
  PoolCreate: "Create Pool",
  SwapExactAmountOut: "Trade",
  SwapExactAmountIn: "Trade",
  PoolExit: "Remove Liquidity",
  PoolJoin: "Add Liquidity",
} as const;

type Action = typeof humanReadableEventMap[keyof typeof humanReadableEventMap];

export type TradeEvent = {
  marketId: number;
  assetId: AssetId;
  question: string;
  action: Action;
  time: string;
  blockNumber: number;
};

type MarketHeader = {
  question: string;
};

export const useTransactionHistory = (address: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, transactionHistoryKey, address],
    async () => {
      if (isIndexedSdk(sdk) && address) {
        const { historicalAssets } = await sdk.indexer.client.request<{
          historicalAssets: {
            assetId: string | AssetId;
            dAmountInPool: string;
            baseAssetTraded: string;
            timestamp: string;
            event: string;
            blockNumber: number;
          }[];
        }>(transactionHistoryQuery, {
          address: address,
        });

        const eventTypesToDisplay = Object.keys(humanReadableEventMap);

        const eventsToDisplay = historicalAssets.filter((asset) =>
          eventTypesToDisplay.includes(asset.event),
        );

        const marketIds = new Set<number>(
          eventsToDisplay.map((event) => {
            const assetId = parseAssetId(event.assetId).unwrap();

            return IOMarketOutcomeAssetId.is(assetId)
              ? getMarketIdOf(assetId)
              : null;
          }),
        );

        const marketIdsArray = Array.from(marketIds).sort((a, b) => a - b);

        const { markets } = await sdk.indexer.client.request<{
          markets: MarketHeader[];
        }>(marketHeaderQuery, {
          marketIds: marketIdsArray,
        });

        const marketsMap: Map<number, MarketHeader> = new Map();
        marketIdsArray.forEach((marketId, index) => {
          marketsMap.set(marketId, markets[index]);
        });

        const transactions: TradeEvent[] = eventsToDisplay.map(
          (transaction) => {
            const action: Action = humanReadableEventMap[transaction.event];
            const assetId = parseAssetId(transaction.assetId).unwrap();
            const marketId = IOMarketOutcomeAssetId.is(assetId)
              ? getMarketIdOf(assetId)
              : null;

            return {
              marketId: marketId,
              question: marketsMap.get(marketId).question,
              action: action,
              time: transaction.timestamp,
              blockNumber: transaction.blockNumber,
            };
          },
        );

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
