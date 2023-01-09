import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { poolsRootKey } from "./usePool";

export const rootKey = "infinite-pools-list";

export const useInfinitePoolsList = () => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();
  const limit = 20;

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
    onSuccess(data) {
      data.pages
        .flatMap(({ data }) => data)
        .forEach((pool) => {
          queryClient.setQueryData(
            [id, poolsRootKey, { poolId: pool.poolId }],
            pool,
          );
        });
    },
  });

  return query;
};
