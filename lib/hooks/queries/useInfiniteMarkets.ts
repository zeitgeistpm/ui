import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { IndexerContext, isIndexedSdk, Market } from "@zeitgeistpm/sdk";
import { MarketOrderByInput, MarketWhereInput } from "@zeitgeistpm/indexer";
import { getOutcomesForMarkets } from "lib/gql/markets-list/outcomes-for-markets";
import { getCurrentPrediction } from "lib/util/assets";
import {
  MarketsListFiltersQuery,
  MarketsOrderBy,
} from "lib/types/market-filter";
import { marketsRootQuery } from "./useMarket";
import { useSdkv2 } from "../useSdkv2";
import { MarketOutcomes } from "lib/types/markets";
import { MarketStatus } from "@zeitgeistpm/indexer";
import { hiddenMarketIds } from "lib/constants/markets";
import { marketMetaFilter } from "./constants";
import { isNTT } from "../../constants";
import { ScoringRule } from "@zeitgeistpm/indexer";

export const rootKey = "markets-filtered";

const orderByMap = {
  [MarketsOrderBy.Newest]: MarketOrderByInput.MarketIdDesc,
  [MarketsOrderBy.Oldest]: MarketOrderByInput.MarketIdAsc,
  [MarketsOrderBy.MostVolume]: MarketOrderByInput.PoolVolumeDesc,
  [MarketsOrderBy.LeastVolume]: MarketOrderByInput.PoolVolumeAsc,
};

const validMarketWhereInput: MarketWhereInput = {
  marketId_not_in: JSON.parse(hiddenMarketIds),
  ...marketMetaFilter,
};

export type QueryMarketData = Market<IndexerContext> & {
  outcomes: MarketOutcomes;
  prediction: { name: string; price: number };
};

export const useInfiniteMarkets = (
  orderBy: MarketsOrderBy,
  withLiquidityOnly = false,
  filters?: MarketsListFiltersQuery,
) => {
  const [sdk, id] = useSdkv2();

  const limit = 12;
  const fetcher = async ({
    pageParam = 0,
  }): Promise<{ data: QueryMarketData[]; next: number | boolean }> => {
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

    const markets: Market<IndexerContext>[] = await sdk.model.markets.list({
      where: {
        AND: [
          {
            ...validMarketWhereInput,
            status_not_in: [MarketStatus.Destroyed],
            status_in: statuses.length === 0 ? undefined : statuses,
            tags_containsAny: tags?.length === 0 ? undefined : tags,
            baseAsset_in: isNTT
              ? ['{"foreignAsset":3}']
              : currencies?.length !== 0
                ? currencies
                : undefined,
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
                scoringRule_eq: ScoringRule.Lmsr,
                neoPool_isNull: withLiquidityOnly ? false : undefined,
              },
            ],
          },
        ],
      },
      offset: !pageParam ? 0 : limit * pageParam,
      limit: limit,
      order: orderByMap[orderBy],
    });

    const resMarkets: Array<QueryMarketData> = markets.map((market) => {
      const outcomes: MarketOutcomes = market.assets.map((asset, index) => {
        return {
          price: asset.price,
          name: market.categories?.[index].name ?? "",
          assetId: asset.assetId,
          amountInPool: asset.amountInPool,
        };
      });

      const prediction = getCurrentPrediction(outcomes, market);

      return {
        ...market,
        outcomes,
        prediction,
      };
    });

    return {
      data: resMarkets,
      next: markets.length >= limit ? pageParam + 1 : false,
    };
  };

  const queryClient = useQueryClient();
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
      data.pages
        .flatMap((p) => p.data)
        .forEach((market) => {
          queryClient.setQueryData(
            [id, marketsRootQuery, market.marketId],
            market,
          );
        });
    },
    staleTime: 10_000,
  });
  return query;
};
