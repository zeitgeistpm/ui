import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { MarketListItem } from "lib/types/market-or-combo";
import { MarketsOrderBy } from "lib/types/market-filter";
type MarketsListFiltersQuery = any;
import {
  MarketStatus,
  ScoringRule,
  MarketOrderByInput,
} from "@zeitgeistpm/indexer";
const validMarketWhereInput: any = {};
const WHITELISTED_TRUSTED_CREATORS: any = [];
type IndexerContext = any;
import { FullCmsMarketMetadata } from "lib/cms/markets";
import { marketCmsDatakeyForMarket } from "./cms/useMarketCmsMetadata";

const rootKey = "infinite-markets";

const orderByMap: any = {
  "most-volume": { volume_DESC: {} },
  "most-recent": { marketId_DESC: {} },
  "ending-soon": { period_end_ASC: {} },
  "most-popular": { volume_DESC: {} }, // Could be enhanced with better popularity metric
};

export const useInfiniteMarkets = (
  orderBy: MarketsOrderBy,
  withLiquidityOnly = false,
  filters?: MarketsListFiltersQuery,
  options?: { enabled?: boolean },
) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const limit = 12;
  const fetcher = async ({
    pageParam = 0,
  }): Promise<{ data: MarketListItem[]; next: number | boolean }> => {
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

    // Fetch regular markets (no combo logic, full limit)
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
      limit: limit, // Full limit for markets
      order: orderByMap[orderBy] as MarketOrderByInput,
    });
    // Apply CMS data to regular markets
    for (const market of markets) {
      const cmsData: FullCmsMarketMetadata | undefined =
        queryClient.getQueryData(marketCmsDatakeyForMarket(market.marketId));
      if (cmsData?.question) market.question = cmsData.question;
      if (cmsData?.imageUrl) market.img = cmsData.imageUrl;
    }

    // Transform regular markets to MarketListItem
    const marketItems: MarketListItem[] = markets.map((market) => {
      const liquidity =
        market.pool?.baseAsset || market.neoPool?.totalStake || "0";
      const volume = market.volume || "0";

      return {
        type: "market",
        data: market,
        stats: {
          liquidity,
          participants: 0,
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

    return {
      data: marketItems,
      next: marketItems.length >= limit ? pageParam + 1 : false,
    };
  };

  const query = useInfiniteQuery({
    queryKey: [id, rootKey, filters, orderBy, withLiquidityOnly],
    queryFn: fetcher,
    enabled:
      (options?.enabled ?? true) &&
      isIndexedSdk(sdk) &&
      filters !== undefined &&
      orderBy !== undefined &&
      withLiquidityOnly !== undefined &&
      Boolean(sdk),
    getNextPageParam: (lastPage) => lastPage.next,
    staleTime: 10_000,
  });

  return query;
};
