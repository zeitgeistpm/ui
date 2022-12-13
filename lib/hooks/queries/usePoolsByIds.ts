import { useQuery } from "@tanstack/react-query";
import {
  isIndexedSdk,
  isMarketIdQuery,
  isPoolIdQuery,
  PoolGetQuery,
} from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pools-by-id";

export const usePoolsByIds = (poolQueries?: PoolGetQuery[]) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, poolQueries],
    async () => {
      if (poolQueries && isIndexedSdk(sdk)) {
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
      enabled: Boolean(sdk && poolQueries && isIndexedSdk(sdk)),
    },
  );

  return query;
};
