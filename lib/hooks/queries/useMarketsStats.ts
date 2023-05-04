import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { useSdkv2 } from "../useSdkv2";
import { useMarketsByIds } from "./useMarketsByIds";

export const marketsStatsRootQuery = "marketsStats";

export const useMarketsStats = (
  marketIds: number[],
): UseQueryResult<MarketStats[]> => {
  const [sdk, id] = useSdkv2();
  const { data: markets } = useMarketsByIds(
    marketIds.map((id) => ({ marketId: id })),
  );

  const marketIdPoolIdMap =
    markets?.map((market) => {
      return {
        marketId: market.marketId,
        poolId: market.pool?.poolId,
      };
    }) ?? [];

  return useQuery<MarketStats[]>(
    [marketsStatsRootQuery, id, marketIds],
    async () => {
      if (!isIndexedSdk(sdk)) return [];
      const poolStats = await getMarketsStats(sdk.indexer.client, marketIds);

      return poolStats;
    },
    {
      enabled: sdk != null && isIndexedSdk(sdk) && marketIds.length > 0,
      keepPreviousData: true,
    },
  );
};
