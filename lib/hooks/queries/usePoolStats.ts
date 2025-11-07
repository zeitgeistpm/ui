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

  return useQuery(
    [poolStatsRootQuery, id, poolIds],
    async () => {
      if (!isIndexedSdk(sdk)) return [];
      const poolStats = await getPoolStats(sdk.indexer.client as unknown as GraphQLClient, poolIds);
      return poolStats;
    },
    {
      initialData: [],
      refetchInterval: 5 * 60 * 1000,
      refetchOnMount: false,
      enabled: Boolean(sdk && poolIds.length > 0),
    },
  );
};