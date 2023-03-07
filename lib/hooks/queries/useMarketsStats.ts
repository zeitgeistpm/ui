import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { useStore } from "lib/stores/Store";
import { useSdkv2 } from "../useSdkv2";

export const marketsStatsRootQuery = "marketsStats";

export const useMarketsStats = (
  marketIds: number[] = [],
): UseQueryResult<MarketStats[]> => {
  const { graphQLClient } = useStore();
  const [sdk, id] = useSdkv2();

  return useQuery<MarketStats[]>(
    [marketsStatsRootQuery, id, marketIds],
    () => {
      if (graphQLClient == null) {
        return [];
      }
      return getMarketsStats(graphQLClient, marketIds);
    },
    {
      enabled: graphQLClient != null || !!marketIds.length || sdk != null,
    },
  );
};
