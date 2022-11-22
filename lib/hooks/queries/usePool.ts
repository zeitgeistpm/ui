import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isRpcData, PoolGetQuery } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pool";

export const usePool = (getPoolQuery?: PoolGetQuery) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, getPoolQuery],
    async () => {
      return sdk.model.swaps.getPool(getPoolQuery);
    },
    {
      enabled: Boolean(sdk && getPoolQuery),
    },
  );

  return query;
};
