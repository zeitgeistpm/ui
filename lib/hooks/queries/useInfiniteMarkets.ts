import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { IndexerContext, isIndexedSdk, Market } from "@zeitgeistpm/sdk-next";
import { MarketOrderByInput } from "@zeitgeistpm/indexer";
import { getOutcomesForMarkets } from "lib/gql/markets-list/outcomes-for-markets";
import objectHash from "object-hash";
import { useStore } from "lib/stores/Store";
import { getCurrentPrediction } from "lib/util/assets";
import {
  MarketFilter,
  MarketFilterType,
  MarketsOrderBy,
} from "lib/types/market-filter";
import { marketsRootQuery } from "./useMarket";
import { useSdkv2 } from "../useSdkv2";
import { MarketOutcomes } from "lib/types/markets";
import { MarketStatus } from "@zeitgeistpm/indexer";

export const rootKey = "markets-filtered";

const hashFilters = (filters: MarketFilter[]): string => {
  const sortedFilters = [...filters].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type < b.type ? -1 : 1;
    } else {
      return a.value < b.value ? -1 : 1;
    }
  });
  const hashed = objectHash(sortedFilters);
  return hashed;
};

const getFilterValuesByType = (
  filters: MarketFilter[],
  type: MarketFilterType,
): string[] => {
  return filters.filter((f) => f.type === type).map((f) => f.value);
};

const orderByMap = {
  [MarketsOrderBy.Newest]: MarketOrderByInput.MarketIdDesc,
  [MarketsOrderBy.Oldest]: MarketOrderByInput.MarketIdAsc,
  [MarketsOrderBy.MostVolume]: MarketOrderByInput.PoolVolumeDesc,
  [MarketsOrderBy.LeastVolume]: MarketOrderByInput.PoolVolumeAsc,
};

export type QueryMarketData = Market<IndexerContext> & {
  outcomes: MarketOutcomes;
  prediction: { name: string; price: number };
};

export const useInfiniteMarkets = (
  orderBy: MarketsOrderBy,
  withLiquidityOnly = false,
  filters?: MarketFilter[],
) => {
  const [sdk, id] = useSdkv2();
  const { graphQLClient } = useStore();

  filters = filters ?? [];

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

    const statuses = getFilterValuesByType(filters, "status") as MarketStatus[];
    const tags = getFilterValuesByType(filters, "tag");
    const currencies = getFilterValuesByType(filters, "currency");

    const markets: Market<IndexerContext>[] = await sdk.model.markets.list({
      where: {
        categories_isNull: false,
        status_not_in: [MarketStatus.Destroyed],
        status_in: statuses.length === 0 ? undefined : statuses,
        tags_containsAny: tags.length === 0 ? undefined : tags,
        pool_isNull: withLiquidityOnly ? false : undefined,
        pool: withLiquidityOnly
          ? { ztgQty_gt: 0 }
          : undefined && currencies.length === 0
          ? undefined
          : {
              baseAsset_in: currencies,
            },
      },
      offset: !pageParam ? 0 : limit * pageParam,
      limit: limit,
      order: orderByMap[orderBy],
    });

    const outcomes = await getOutcomesForMarkets(graphQLClient, markets);

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
    queryKey: [id, rootKey, hashFilters(filters), orderBy, withLiquidityOnly],
    queryFn: fetcher,
    enabled:
      Boolean(sdk) &&
      isIndexedSdk(sdk) &&
      filters !== undefined &&
      orderBy !== undefined &&
      withLiquidityOnly !== undefined,
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
