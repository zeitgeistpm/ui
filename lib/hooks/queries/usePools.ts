import { useInfiniteQuery } from "@tanstack/react-query";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pools";

export const usePools = () => {
  const [sdk, id] = useSdkv2();

  const limit = 9999999;

  const fetcher = async ({ pageParam = 0 }) => {
    const pools = await sdk.model.swaps.listPools({
      offset: !pageParam ? 0 : limit * pageParam,
      limit: limit,
    });

    return {
      data: pools,
      next: pools.length >= limit ? pageParam + 1 : undefined,
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
