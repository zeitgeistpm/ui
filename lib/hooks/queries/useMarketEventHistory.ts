import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isRpcSdk, isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { MarketEvent } from "lib/gql/market-history";
import { useMarket } from "./useMarket";
import { getMarketHistory } from "lib/gql/market-history";

export const marketsEventsRootQuery = "market-events";

export type MarketEventHistory = {
  start: MarketEvent;
  end: MarketEvent;
  reported: MarketEvent;
  disputes: MarketEvent[];
  resolved: MarketEvent;
};

export const useMarketEventHistory = (
  marketId: string,
): UseQueryResult<MarketEventHistory> => {
  const [sdk, id] = useSdkv2();

  const { data: market } = useMarket({ marketId: Number(marketId) });

  return useQuery(
    [marketsEventsRootQuery, id, marketId],
    async () => {
      if (isIndexedSdk(sdk) && isRpcSdk(sdk) && market) {
        const response = await getMarketHistory(
          sdk.indexer.client,
          Number(marketId),
        );
        const start = response.filter((e) => {
          e.timestamp = new Date(e.timestamp).getTime();
          return e.event === "MarketCreated";
        })[0];
        const end = response.filter((e) => {
          e.timestamp = new Date(e.timestamp).getTime();
          return e.event === "MarketClosed";
        })[0];
        const disputes = response.filter((e) => {
          e.timestamp = new Date(e.timestamp).getTime();
          return e.event === "MarketDisputed";
        });
        const reported = response.filter((e) => {
          e.timestamp = new Date(e.timestamp).getTime();
          return e.event === "MarketReported";
        })[0];
        const resolved = response.filter((e) => {
          e.timestamp = new Date(e.timestamp).getTime();
          return e.event === "MarketResolved";
        })[0];

        const marketHistory = {
          start,
          end,
          reported,
          disputes,
          resolved,
        };
        return marketHistory;
      }
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk) && isRpcSdk(sdk) && market),
      staleTime: 10_000,
    },
  );
};
