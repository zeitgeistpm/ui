import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isIndexedSdk, isRpcSdk } from "@zeitgeistpm/sdk";
import { 
  MarketOrComboItem, 
  MarketListItem, 
  ComboPoolListItem, 
  MarketStats 
} from "lib/types/market-or-combo";
import { 
  getComboPools, 
  getComboPoolStats, 
  getMarketsByIds,
  ComboPoolData,
  ComboPoolStatsData,
  MarketBasicData 
} from "lib/gql/combo-pools";
import { MarketsListFiltersQuery, MarketsOrderBy } from "lib/hooks/useMarketsUrlQuery";
import {
  MarketStatus,
  ScoringRule,
  validMarketWhereInput,
  WHITELISTED_TRUSTED_CREATORS,
  MarketOrderByInput,
  Market,
  IndexerContext,
  FullMarketFragment,
} from "@zeitgeistpm/indexer";
import { FullCmsMarketMetadata } from "lib/cms/markets";
import { marketCmsDatakeyForMarket } from "./cms/useMarketCmsMetadata";

const rootKey = "infinite-markets-with-combos";

const orderByMap: Record<MarketsOrderBy, any> = {
  "most-volume": { volume_DESC: {} },
  "most-recent": { marketId_DESC: {} },
  "ending-soon": { period_end_ASC: {} },
  "most-popular": { volume_DESC: {} }, // Could be enhanced with better popularity metric
};

export const useInfiniteMarketsWithCombos = (
  orderBy: MarketsOrderBy,
  withLiquidityOnly = false,
  filters?: MarketsListFiltersQuery,
) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const limit = 12;
  const fetcher = async ({
    pageParam = 0,
  }): Promise<{ data: MarketOrComboItem[]; next: number | boolean }> => {
    if (
      !isIndexedSdk(sdk) ||
      filters == null ||
      orderBy == null ||
      withLiquidityOnly == null
    ) {
      return {
        data: [],
        next: false,
      };
    }

    const statuses = filters.status as MarketStatus[];
    const tags = filters.tag;
    const currencies = filters.currency;

    // Fetch regular markets
    const markets: Market<IndexerContext>[] = await sdk.model.markets.list({
      where: {
        AND: [
          {
            ...validMarketWhereInput,
            status_not_in: [MarketStatus.Destroyed],
            status_in: statuses.length === 0 ? undefined : statuses,
            tags_containsAny: tags?.length === 0 ? undefined : tags,
            baseAsset_in: currencies?.length !== 0 ? currencies : undefined,
            scoringRule_not_eq: ScoringRule.Parimutuel,
          },
          {
            disputeMechanism_isNull: false,
            OR: [
              {
                creator_in: WHITELISTED_TRUSTED_CREATORS,
              },
            ],
          },
          {
            OR: [
              {
                scoringRule_eq: ScoringRule.Cpmm,
                pool_isNull: withLiquidityOnly ? false : undefined,
                ...(withLiquidityOnly
                  ? {
                      pool: {
                        account: {
                          balances_some: {
                            balance_gt: 0,
                          },
                        },
                      },
                    }
                  : {}),
              },
              {
                scoringRule_eq: ScoringRule.AmmCdaHybrid,
                neoPool_isNull: withLiquidityOnly ? false : undefined,
              },
              {
                scoringRule_eq: ScoringRule.Lmsr,
                neoPool_isNull: withLiquidityOnly ? false : undefined,
              },
            ],
          },
        ],
      },
      offset: !pageParam ? 0 : limit * pageParam,
      limit: Math.floor(limit * 0.7), // Reserve 30% for combo pools
      order: orderByMap[orderBy] as MarketOrderByInput,
    });

    // Fetch combo pools (only on first page for now)
    let comboPools: ComboPoolData[] = [];
    if (pageParam === 0) {
      comboPools = await getComboPools(
        sdk.indexer.client as any, 
        Math.floor(limit * 0.3), // 30% of limit for combo pools
        0
      );
    }

    // Get stats for combo pools
    let comboPoolStats: ComboPoolStatsData[] = [];
    if (comboPools.length > 0) {
      comboPoolStats = await getComboPoolStats(
        sdk.indexer.client as any,
        comboPools.map(pool => pool.poolId)
      );
    }

    // Get associated markets for combo pools
    const allComboMarketIds = [...new Set(comboPools.flatMap(pool => pool.marketIds))];
    let associatedMarkets: MarketBasicData[] = [];
    if (allComboMarketIds.length > 0) {
      associatedMarkets = await getMarketsByIds(
        sdk.indexer.client as any,
        allComboMarketIds
      );
    }

    // Apply CMS data to regular markets
    for (const market of markets) {
      const cmsData: FullCmsMarketMetadata | undefined =
        queryClient.getQueryData(marketCmsDatakeyForMarket(market.marketId));
      if (cmsData?.question) market.question = cmsData.question;
      if (cmsData?.imageUrl) market.img = cmsData.imageUrl;
    }

    // Transform regular markets to MarketListItem
    const marketItems: MarketListItem[] = markets.map((market) => {
      const liquidity = market.pool?.baseAsset || market.neoPool?.totalStake || "0";
      const volume = market.volume || "0";
      
      return {
        type: "market",
        data: market,
        stats: {
          liquidity,
          participants: 0, // Would need additional query
          volume,
        },
        marketId: market.marketId,
        slug: market.slug || `market-${market.marketId}`,
        question: market.question || "Untitled Market",
        categories: market.categories || [],
        status: market.status,
        baseAsset: market.baseAsset,
        link: `/markets/${market.marketId}`,
      };
    });

    // Pre-fetch AMM2 pool data for combo pools using TanStack Query
    // This optimization warms up the cache so ComboPoolCards load instantly
    if (isRpcSdk(sdk) && comboPools.length > 0) {
      const prefetchPromises = comboPools.map(async (pool) => {
        try {
          // Prefetch using the same query key as useAmm2Pool hook
          await queryClient.prefetchQuery({
            queryKey: [id, "amm2-pool", 0, pool.poolId],
            queryFn: async () => {
              const poolRes = await sdk.api.query.neoSwaps.pools(pool.poolId);
              const unwrappedRes = poolRes && poolRes.isSome ? poolRes.unwrap() : null;
              
              if (unwrappedRes) {
                // Minimal processing for prefetch - full processing in useAmm2Pool
                return {
                  poolId: pool.poolId,
                  accountId: unwrappedRes.accountId.toString(),
                  liquidity: unwrappedRes.liquidityParameter.toString(),
                  swapFee: unwrappedRes.swapFee.toString(),
                  reserves: new Map(), // Will be populated by useAmm2Pool
                  assetIds: [], // Will be populated by useAmm2Pool
                  accounts: [], // Will be populated by useAmm2Pool
                  totalShares: unwrappedRes.liquidityParameter.toString(),
                  poolType: JSON.parse(unwrappedRes.poolType.toString()),
                };
              }
              return null;
            },
            staleTime: 60 * 1000,
          });
        } catch (error) {
          console.warn(`Failed to prefetch pool data for pool ${pool.poolId}:`, error);
        }
      });

      // Wait for prefetch to complete (but don't block on errors)
      await Promise.allSettled(prefetchPromises);
    }

    // Transform combo pools to ComboPoolListItem
    const comboPoolItems: ComboPoolListItem[] = comboPools.map((pool) => {
      const poolStats = comboPoolStats.find(s => s.poolId === pool.poolId);
      const poolAssociatedMarkets = associatedMarkets.filter(m => 
        pool.marketIds.includes(m.marketId)
      );

      // Create combined question from associated markets
      const combinedQuestion = poolAssociatedMarkets.length > 0
        ? poolAssociatedMarkets.map((m, index) => 
            index === poolAssociatedMarkets.length - 1 
              ? m.question 
              : m.question + " &"
          ).join("\n")
        : `${pool.poolId}`;

      // Combine categories from associated markets
      const combinedCategories = poolAssociatedMarkets.flatMap(m => m.categories || []);

      // Use the first market's status as the combo status
      const status = poolAssociatedMarkets[0]?.status || "Active";

      return {
        type: "combo",
        data: pool,
        stats: {
          liquidity: poolStats?.liquidity || pool.totalStake,
          participants: poolStats?.participants || 0,
          volume: poolStats?.volume || "0",
        },
        associatedMarkets: poolAssociatedMarkets,
        marketId: pool.marketIds[0] || pool.poolId, // Use first market ID for routing
        slug: `combo-${pool.poolId}`,
        question: combinedQuestion,
        categories: combinedCategories,
        status,
        baseAsset: pool.collateral,
        link: `/multi-market/${pool.poolId}`,
      };
    });

    // Combine and sort all items
    const allItems: MarketOrComboItem[] = [...marketItems, ...comboPoolItems];

    // Sort combined results based on orderBy
    allItems.sort((a, b) => {
      switch (orderBy) {
        case "most-volume":
          return parseFloat(b.stats.volume) - parseFloat(a.stats.volume);
        case "most-recent":
          return b.marketId - a.marketId;
        case "ending-soon":
          // For combo pools, use creation date; for markets use period.end
          if (a.type === "market" && b.type === "market") {
            const aEnd = new Date(a.data.period?.end || 0).getTime();
            const bEnd = new Date(b.data.period?.end || 0).getTime();
            return aEnd - bEnd;
          }
          return 0; // Keep relative order for mixed types
        case "most-popular":
          return parseFloat(b.stats.volume) - parseFloat(a.stats.volume);
        default:
          return 0;
      }
    });

    const limitedItems = allItems.slice(0, limit);

    return {
      data: limitedItems,
      next: limitedItems.length >= limit ? pageParam + 1 : false,
    };
  };

  const query = useInfiniteQuery({
    queryKey: [id, rootKey, filters, orderBy, withLiquidityOnly],
    queryFn: fetcher,
    enabled:
      isIndexedSdk(sdk) &&
      filters !== undefined &&
      orderBy !== undefined &&
      withLiquidityOnly !== undefined &&
      Boolean(sdk),
    getNextPageParam: (lastPage) => lastPage.next,
    onSuccess(data) {
      // Cache individual markets
      data.pages
        .flatMap((p) => p.data)
        .filter((item): item is MarketListItem => item.type === "market")
        .forEach((marketItem) => {
          queryClient.setQueryData(
            [id, "markets", marketItem.marketId],
            marketItem.data,
          );
        });
    },
    staleTime: 10_000,
  });

  return query;
};