import { useQuery } from "@tanstack/react-query";
import { getMarketIdOf, isIndexedSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { gql } from "graphql-request";
import { ZTG } from "lib/constants";
import { useSdkv2 } from "../useSdkv2";

export const transactionHistoryKey = "transaction-history";

const transactionHistoryQuery = gql`
  query TransactionHistory($address: String) {
    historicalAssets(
      where: { accountId_eq: $address }
      orderBy: timestamp_DESC
    ) {
      assetId
      ztgTraded
      timestamp
      event
      newPrice
    }
  }
`;

const marketHeaderQuery = gql`
  query MarketTransactionHeader($marketIds: [Int!]) {
    markets(where: { marketId_in: $marketIds }) {
      question
    }
  }
`;

const humanReadableEventMap = {
  PoolCreate: "Create Pool",
  SwapExactAmountOut: "Trade",
  SwapExactAmountIn: "Trade",
  PoolExit: "Remove Subsidy",
  PoolJoin: "Add Subsidy",
} as const;

type Action = typeof humanReadableEventMap[keyof typeof humanReadableEventMap];

type TradeEvent = {
  question: string;
  action: Action;
  value: number;
  price: number;
  time: string;
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
        const { historicalAssets } = await sdk.context.indexer.client.request<{
          historicalAssets: {
            assetId: string;
            dAmountInPool: string;
            ztgTraded: string;
            newPrice: number;
            timestamp: string;
            event: string;
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
            // const marketId = getMarketIdOf(JSON.parse(event.assetId));
            const assetId = JSON.parse(event.assetId);
            //todo replace with sdk
            const marketId =
              assetId.categoricalOutcome?.[0] ?? assetId.scalarOutcome[0];

            return marketId;
          }),
        );

        const marketIdsArray = Array.from(marketIds);

        const { markets } = await sdk.context.indexer.client.request<{
          markets: MarketHeader[];
        }>(marketHeaderQuery, {
          marketIds: marketIdsArray,
        });

        const marketsMap: Map<number, MarketHeader> = new Map();
        marketIdsArray.forEach((marketId, index) => {
          marketsMap.set(marketId, markets[index]);
        });

        const transactions: TradeEvent[] = eventsToDisplay.map((asset) => {
          const assetId = JSON.parse(asset.assetId);
          const action: Action = humanReadableEventMap[asset.event];

          return {
            question: marketsMap.get(
              assetId.categoricalOutcome?.[0] ?? assetId.scalarOutcome[0],
            ).question,
            action: action,
            value:
              action === "Trade" && asset.ztgTraded != null
                ? new Decimal(asset.ztgTraded).div(ZTG).toNumber()
                : null,
            price: action === "Trade" ? asset.newPrice : null,
            time: asset.timestamp,
          };
        });

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
