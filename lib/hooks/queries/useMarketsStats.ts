import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { useSdkv2 } from "../useSdkv2";

export const marketsStatsRootQuery = "marketsStats";

export const useMarketsStats = (
  markets: { marketId: number; hasPool: boolean }[],
): UseQueryResult<MarketStats[]> => {
  const [sdk, id] = useSdkv2();

  return useQuery<MarketStats[]>(
    [marketsStatsRootQuery, id, markets],
    async () => {
      if (!isIndexedSdk(sdk)) return [];
      const noPoolMarketIds = markets
        .filter((item) => !item.hasPool)
        .map((item) => item.marketId);

      const yesPoolmarketIds = markets
        .filter((item) => item.hasPool)
        .map((item) => item.marketId);

      const yesPoolStats = await getMarketsStats(
        sdk.indexer.client,
        yesPoolmarketIds,
      );

      const noPoolStats: MarketStats[] = noPoolMarketIds.map((id) => {
        return { marketId: id, liquidity: "0", participants: 0 };
      });

      return [...yesPoolStats, ...noPoolStats];
    },
    {
      enabled: (sdk != null && isIndexedSdk(sdk)) || markets?.length > 0,
      keepPreviousData: true,
    },
  );
};
