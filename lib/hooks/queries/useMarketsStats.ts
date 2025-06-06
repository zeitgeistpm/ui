import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { useSdkv2 } from "../useSdkv2";
import { GraphQLClient } from "graphql-request";

export const marketsStatsRootQuery = "markets-stats";

export const useMarketsStats = (
  marketIds: number[],
): UseQueryResult<MarketStats[]> => {
  const [sdk, id] = useSdkv2();

  return useQuery<MarketStats[]>(
    [marketsStatsRootQuery, id, marketIds],
    async () => {
      if (!isIndexedSdk(sdk)) return [];
      const poolStats = await getMarketsStats(sdk.indexer.client as unknown as GraphQLClient, marketIds);
      return poolStats;
    },
    {
      enabled: sdk != null && isIndexedSdk(sdk) && marketIds.length > 0,
      keepPreviousData: true,
      staleTime: 100_000,
    },
  );
};
