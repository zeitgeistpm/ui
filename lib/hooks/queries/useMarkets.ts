import { useInfiniteQuery } from "@tanstack/react-query";
import { MarketStatus } from "lib/types";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "markets";

type Filters = {
  liquidity: boolean;
  tags?: string;
  statuses: MarketStatus[];
};

type SortBy = "Newest" | "Oldest";

export const useMarkets = (filters?: Filters, sortBy?: SortBy) => {
  const [sdk, id] = useSdkv2();

  const limit = 12;

  const fetcher = async ({ pageParam = 0 }) => {
    const markets = await sdk.model.markets.list({
      offset: !pageParam ? 0 : limit * pageParam,
      limit: limit,
    });

    return {
      data: markets,
      next: markets.length >= limit ? pageParam + 1 : undefined,
    };
  };

  const query = useInfiniteQuery({
    queryKey: [id, rootKey],
    queryFn: fetcher,
    enabled: Boolean(sdk),
    getNextPageParam: (lastPage) => lastPage.next,
  });

  return query;
};
