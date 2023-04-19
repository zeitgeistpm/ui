import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { graphQlClient } from "lib/constants";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { useSdkv2 } from "../useSdkv2";
import { useMarketsByIds } from "./useMarketsByIds";

export const marketsStatsRootQuery = "marketsStats";

export const useMarketsStats = (
  markets: { marketId: number; hasPool: boolean }[],
): UseQueryResult<MarketStats[]> => {
  const [sdk, id] = useSdkv2();

  return useQuery<MarketStats[]>(
    [marketsStatsRootQuery, id, markets],
    async () => {
      const noPoolMarketIds = markets
        .filter((item) => !item.hasPool)
        .map((item) => item.marketId);

      const yesPoolmarketIds = markets
        .filter((item) => item.hasPool)
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
      enabled: sdk != null || markets.length > 0,
      keepPreviousData: true,
    },
  );
};
