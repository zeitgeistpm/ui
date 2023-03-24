import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { graphQlClient } from "lib/constants";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { useSdkv2 } from "../useSdkv2";

export const marketsStatsRootQuery = "marketsStats";

export const useMarketsStats = (
  marketIds: number[] = [],
): UseQueryResult<MarketStats[]> => {
  const [sdk, id] = useSdkv2();

  return useQuery<MarketStats[]>(
    [marketsStatsRootQuery, id, marketIds],
    () => {
      if (graphQlClient == null) {
        return [];
      }
      return getMarketsStats(graphQlClient, marketIds);
    },
    {
      enabled: graphQlClient != null || !!marketIds.length || sdk != null,
    },
  );
};
