import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Context,
  IndexedPool,
  isIndexedSdk,
  isMarketIdQuery,
  isPoolIdQuery,
  PoolGetQuery,
} from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { poolsRootKey } from "./usePool";

export const rootKey = "pools-by-id";

export const usePoolsByIds = (poolQueries?: PoolGetQuery[]) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const query = useQuery<IndexedPool<Context>[]>(
    [id, rootKey, poolQueries],
    async () => {
      if (poolQueries && isIndexedSdk(sdk)) {
        // TODO: Does this include neo-swaps pools? If not, then we should also query the neo-swaps pools.
        return sdk.model.swaps.listPools({
          where: {
            OR: [
              {
                poolId_in: poolQueries
                  .filter(isPoolIdQuery)
                  .map((q) => q.poolId),
              },
              {
                marketId_in: poolQueries
                  .filter(isMarketIdQuery)
                  .map((q) => q.marketId),
              },
            ],
          },
        });
      }
      return [];
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && poolQueries && isIndexedSdk(sdk)),
      onSuccess(data) {
        data?.forEach((pool) => {
          queryClient.setQueryData(
            [id, poolsRootKey, { marketId: pool.marketId }],
            pool,
          );
          queryClient.setQueryData(
            [id, poolsRootKey, { poolId: pool.poolId }],
            pool,
          );
        });
      },
    },
  );

  return query;
};
