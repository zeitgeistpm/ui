import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { getMarket } from "lib/gql/markets";
import {
  MarketEventHistory,
  MarketPageIndexedData,
} from "lib/gql/market-event-history";
import { useSdkv2 } from "../useSdkv2";

export const marketsEventsRootQuery = "marketsEvents";

export const useMarketEventHistory = (
  marketId: number,
): UseQueryResult<MarketEventHistory[]> => {
  const [sdk, id] = useSdkv2();

  return useQuery<MarketPageIndexedData>(
    [marketsEventsRootQuery, id, marketId],
    async () => {
      if (!isIndexedSdk(sdk)) return [];

      const market = await getMarket(sdk.indexer.client, marketId.toString());

      return market;
    },
    {
      enabled: sdk != null && isIndexedSdk(sdk),
      keepPreviousData: true,
    },
  );
};
