import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isRpcData, PoolGetQuery } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "market";

export const useMarket = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, marketId],
    async () => {
      return sdk.model.markets.get({ marketId });
    },
    {
      enabled: Boolean(sdk),
    },
  );

  return query;
};
