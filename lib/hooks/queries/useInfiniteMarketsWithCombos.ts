import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
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
import { MarketsOrderBy } from "lib/types/market-filter";
type MarketsListFiltersQuery = any;
import {
  MarketStatus,
  ScoringRule,
  MarketOrderByInput,
  Market,
  FullMarketFragment,
} from "@zeitgeistpm/indexer";
const validMarketWhereInput: any = {};
const WHITELISTED_TRUSTED_CREATORS: any = [];
type IndexerContext = any;
import { FullCmsMarketMetadata } from "lib/cms/markets";
import { marketCmsDatakeyForMarket } from "./cms/useMarketCmsMetadata";

const rootKey = "infinite-markets-with-combos";

const orderByMap: any = {
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
    const markets: any[] = await sdk.model.markets.list({
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

    // Note: Removed prefetch logic that was caching incomplete pool data
    // useAmm2Pool hook now handles fetching with proper caching
    // The incomplete prefetch was causing combo market cards to display
    // incorrect data until a page refresh

    // Transform combo pools to ComboPoolListItem
    const comboPoolItems: ComboPoolListItem[] = comboPools
      .map((pool) => {
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

        // FIXED: A combo market is only Active if ALL source markets are Active
        // This matches the logic in /multi-market/[poolid].tsx
        const allMarketsActive = poolAssociatedMarkets.length > 0
          && poolAssociatedMarkets.every(m => m.status === MarketStatus.Active);

        // If not all markets are active, use the status of the first non-active market
        const status = allMarketsActive
          ? MarketStatus.Active
          : (poolAssociatedMarkets.find(m => m.status !== MarketStatus.Active)?.status || "Closed");

        return {
          type: "combo" as const,
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
      })
      // Filter out combo pools that don't match the status filter
      .filter((item) => {
        // If no status filter is applied, show all combo pools
        if (statuses.length === 0) return true;
        // If status filter is applied, only show combo pools that match
        return statuses.includes(item.status as MarketStatus);
      });

    // Combine and sort all items
    const allItems: MarketOrComboItem[] = [...marketItems, ...comboPoolItems];

    // Sort combined results based on orderBy
    allItems.sort((a, b) => {
      switch (orderBy as any) {
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