import { useInfiniteQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { MarketOrderByInput } from "@zeitgeistpm/indexer";
import { getOutcomesForMarkets } from "lib/gql/markets-list/outcomes-for-markets";
import { useStore } from "lib/stores/Store";
import { getCurrentPrediction } from "lib/util/assets";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "markets";

export const useMarkets = () => {
  const [sdk, id] = useSdkv2();
  const { graphQLClient } = useStore();

  const limit = 12;

  const fetcher = async ({ pageParam = 0 }) => {
    if (!isIndexedSdk(sdk)) {
      return {
        data: [],
        next: false,
      };
    }
    const markets = await sdk.model.markets.list({
      where: {
        categories_isNull: false,
        status_not_in: ["Destroyed"],
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
    queryKey: [id, rootKey],
    queryFn: fetcher,
    enabled: Boolean(sdk) && isIndexedSdk(sdk),
    getNextPageParam: (lastPage) => lastPage.next,
  });

  return query;
};
