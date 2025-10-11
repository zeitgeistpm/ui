import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { ComboPoolListItem } from "lib/types/market-or-combo";
import {
  getComboPools,
  getComboPoolStats,
  getMarketsByIds,
  ComboPoolData,
  ComboPoolStatsData,
  MarketBasicData,
} from "lib/gql/combo-pools";
import { MarketsOrderBy } from "lib/types/market-filter";
import { MarketStatus } from "@zeitgeistpm/indexer";

type MarketsListFiltersQuery = any;

const rootKey = "infinite-multi-markets";

export const useInfiniteMultiMarkets = (
  orderBy: MarketsOrderBy,
  filters?: MarketsListFiltersQuery,
) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const limit = 12;

  const fetcher = async ({
    pageParam = 0,
  }): Promise<{ data: ComboPoolListItem[]; next: number | boolean }> => {
    if (!isIndexedSdk(sdk) || filters == null || orderBy == null) {
      return {
        data: [],
        next: false,
      };
    }

    const statuses = filters.status as MarketStatus[];

    // Fetch combo pools with proper pagination
    const comboPools: ComboPoolData[] = await getComboPools(
      sdk.indexer.client as any,
      limit,
      pageParam * limit,
    );

    // Get stats for combo pools
    let comboPoolStats: ComboPoolStatsData[] = [];
    if (comboPools.length > 0) {
      comboPoolStats = await getComboPoolStats(
        sdk.indexer.client as any,
        comboPools.map((pool) => pool.poolId),
      );
    }

    // Get associated markets for combo pools
    const allComboMarketIds = [
      ...new Set(comboPools.flatMap((pool) => pool.marketIds)),
    ];
    let associatedMarkets: MarketBasicData[] = [];
    if (allComboMarketIds.length > 0) {
      associatedMarkets = await getMarketsByIds(
        sdk.indexer.client as any,
        allComboMarketIds,
      );
    }

    // Transform combo pools to ComboPoolListItem
    const comboPoolItems: ComboPoolListItem[] = comboPools
      .map((pool) => {
        const poolStats = comboPoolStats.find((s) => s.poolId === pool.poolId);
        const poolAssociatedMarkets = associatedMarkets.filter((m) =>
          pool.marketIds.includes(m.marketId),
        );

        // Create combined question from associated markets
        const combinedQuestion =
          poolAssociatedMarkets.length > 0
            ? poolAssociatedMarkets
                .map((m, index) =>
                  index === poolAssociatedMarkets.length - 1
                    ? m.question
                    : m.question + " &",
                )
                .join("\n")
            : `${pool.poolId}`;

        // Combine categories from associated markets
        const combinedCategories = poolAssociatedMarkets.flatMap(
          (m) => m.categories || [],
        );

        // A combo market is only Active if ALL source markets are Active
        const allMarketsActive =
          poolAssociatedMarkets.length > 0 &&
          poolAssociatedMarkets.every((m) => m.status === MarketStatus.Active);

        // If not all markets are active, use the status of the first non-active market
        const status = allMarketsActive
          ? MarketStatus.Active
          : poolAssociatedMarkets.find((m) => m.status !== MarketStatus.Active)
              ?.status || "Closed";

        return {
          type: "combo" as const,
          data: pool,
          stats: {
            liquidity: poolStats?.liquidity || pool.totalStake,
            participants: poolStats?.participants || 0,
            volume: poolStats?.volume || "0",
          },
          associatedMarkets: poolAssociatedMarkets,
          marketId: pool.marketIds[0] || pool.poolId,
          slug: `combo-${pool.poolId}`,
          question: combinedQuestion,
          categories: combinedCategories,
          status,
          baseAsset: pool.collateral,
          link: `/multi-market/${pool.poolId}`,
        };
      })
      // Filter out combo pools that don't match the status filter
      .filter((item) => {
        // If no status filter is applied, show all combo pools
        if (statuses.length === 0) return true;
        // If status filter is applied, only show combo pools that match
        return statuses.includes(item.status as MarketStatus);
      });

    // Sort results based on orderBy
    comboPoolItems.sort((a, b) => {
      switch (orderBy as any) {
        case "most-volume":
          return parseFloat(b.stats.volume) - parseFloat(a.stats.volume);
        case "most-recent":
          return b.marketId - a.marketId;
        case "most-popular":
          return parseFloat(b.stats.volume) - parseFloat(a.stats.volume);
        default:
          return 0;
      }
    });

    return {
      data: comboPoolItems,
      next: comboPoolItems.length >= limit ? pageParam + 1 : false,
    };
  };

  const query = useInfiniteQuery({
    queryKey: [id, rootKey, filters, orderBy],
    queryFn: fetcher,
    enabled:
      isIndexedSdk(sdk) &&
      filters !== undefined &&
      orderBy !== undefined &&
      Boolean(sdk),
    getNextPageParam: (lastPage) => lastPage.next,
    staleTime: 10_000,
  });

  return query;
};
