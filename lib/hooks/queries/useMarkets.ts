import { useInfiniteQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { MarketOrderByInput } from "@zeitgeistpm/indexer";
import { getOutcomesForMarkets } from "lib/gql/markets-list/outcomes-for-markets";
import objectHash from "object-hash";
import { useStore } from "lib/stores/Store";
import { getCurrentPrediction } from "lib/util/assets";
import { MarketFilter, MarketFilterType } from "lib/types/market-filter";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "markets";

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

export const useMarkets = (filters?: MarketFilter[]) => {
  const [sdk, id] = useSdkv2();
  const { graphQLClient } = useStore();

  filters = filters ?? [];

  const limit = 12;

  const fetcher = async ({ pageParam = 0 }) => {
    if (!isIndexedSdk(sdk) || filters == null) {
      return {
        data: [],
        next: false,
      };
    }

    const statuses = getFilterValuesByType(filters, "status");
    const tags = getFilterValuesByType(filters, "tag");
    const currencies = getFilterValuesByType(filters, "currency");

    const markets = await sdk.model.markets.list({
      where: {
        categories_isNull: false,
        status_not_in: ["Destroyed"],
        status_in: statuses.length === 0 ? undefined : statuses,
        tags_containsAny: tags.length === 0 ? undefined : tags,
        pool:
          currencies.length === 0
            ? undefined
            : {
                baseAsset_in: currencies,
              },
      },
      offset: !pageParam ? 0 : limit * pageParam,
      limit: limit,
      order: MarketOrderByInput.MarketIdDesc,
    });

    const outcomes = await getOutcomesForMarkets(graphQLClient, markets);

    let resMarkets = [];

    for (const m of markets) {
      const marketOutcomes = outcomes[m.marketId];
      const prediction =
        m.pool != null
          ? getCurrentPrediction(marketOutcomes, m as any)
          : "None";

      resMarkets = [
        ...resMarkets,
        { ...m, outcomes: marketOutcomes, prediction },
      ];
    }

    return {
      data: resMarkets,
      next: markets.length >= limit ? pageParam + 1 : undefined,
    };
  };

  const query = useInfiniteQuery({
    queryKey: [id, rootKey, hashFilters(filters)],
    queryFn: fetcher,
    enabled: Boolean(sdk) && isIndexedSdk(sdk),
    getNextPageParam: (lastPage) => lastPage.next,
  });

  return query;
};
