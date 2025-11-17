import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { getPoolStats, PoolStats } from "lib/gql/pool-stats";
import { useSdkv2 } from "../useSdkv2";
import { GraphQLClient } from "graphql-request";

export const poolStatsRootQuery = "pool-stats";

export const usePoolStats = (
  poolIds: number[],
  id?: string | number,
): UseQueryResult<PoolStats[]> => {
  const [sdk] = useSdkv2();

  const isEnabled = Boolean(sdk && isIndexedSdk(sdk) && poolIds.length > 0);

  return useQuery(
    [poolStatsRootQuery, id, ...poolIds],
    async () => {
      if (!isIndexedSdk(sdk)) return [];
      const poolStats = await getPoolStats(sdk.indexer.client as unknown as GraphQLClient, poolIds);
      return poolStats;
    },
    {
      enabled: isEnabled,
      refetchInterval: isEnabled ? 5 * 60 * 1000 : false,
      refetchOnMount: "always", // Always refetch on mount, even if data exists
      refetchOnWindowFocus: true,
      staleTime: 10_000, // Consider data fresh for 10 seconds
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    },
  );
};