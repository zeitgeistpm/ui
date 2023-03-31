import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { graphQlClient } from "lib/constants";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { useSdkv2 } from "../useSdkv2";
import { useMarketsByIds } from "./useMarketsByIds";

export const marketsStatsRootQuery = "marketsStats";

export const useMarketsStats = (
  marketIds: number[] = [],
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
    [marketsStatsRootQuery, id, marketIds, marketIdPoolIdMap],
    async () => {
      const noPoolMarketIds = marketIdPoolIdMap
        .filter((item) => item.poolId == null)
        .map((item) => item.marketId);

      const yesPoolmarketIds = marketIdPoolIdMap
        .filter((item) => item.poolId != null)
        .map((item) => item.marketId);

      const yesPoolStats = await getMarketsStats(
        graphQlClient,
        yesPoolmarketIds,
      );

      const noPoolStats: MarketStats[] = noPoolMarketIds.map((id) => {
        return { marketId: id, liquidity: "0", participants: 0 };
      });

      return [...yesPoolStats, ...noPoolStats];
    },
    {
      enabled: sdk != null || markets != null || marketIds.length > 0,
    },
  );
};
