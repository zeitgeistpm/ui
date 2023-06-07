import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { IndexerContext, isIndexedSdk, Market } from "@zeitgeistpm/sdk-next";
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

export const rootKey = "markets-filtered";

const orderByMap = {
  [MarketsOrderBy.Newest]: MarketOrderByInput.MarketIdDesc,
  [MarketsOrderBy.Oldest]: MarketOrderByInput.MarketIdAsc,
  [MarketsOrderBy.MostVolume]: MarketOrderByInput.PoolVolumeDesc,
  [MarketsOrderBy.LeastVolume]: MarketOrderByInput.PoolVolumeAsc,
};

const validMarketWhereInput: MarketWhereInput = {
  question_isNull: false,
  question_not_eq: "",
  isMetaComplete_eq: true,
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
        ...validMarketWhereInput,
        status_not_in: [MarketStatus.Destroyed],
        status_in: statuses.length === 0 ? undefined : statuses,
        tags_containsAny: tags?.length === 0 ? undefined : tags,
        pool_isNull: withLiquidityOnly ? false : undefined,
        pool: {
          baseAssetQty_gt: withLiquidityOnly ? 0 : undefined,
          baseAsset_in: currencies?.length !== 0 ? currencies : undefined,
        },
      },
      offset: !pageParam ? 0 : limit * pageParam,
      limit: limit,
      order: orderByMap[orderBy],
    });
    const outcomes = await getOutcomesForMarkets(sdk.indexer.client, markets);

    let resMarkets: Array<QueryMarketData> = [];

    for (const m of markets) {
      const marketOutcomes = outcomes[m.marketId];
      const prediction =
        m.pool != null
          ? getCurrentPrediction(marketOutcomes, m as any)
          : { name: "None", price: 0 };

      resMarkets = [
        ...resMarkets,
        { ...m, outcomes: marketOutcomes, prediction },
      ];
    }

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
  });
  return query;
};
