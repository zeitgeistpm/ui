import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pools";

export const useMarketDeadlineConstants = () => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [rootKey],
    () => async () => {
      if (isRpcSdk(sdk)) {
        sdk.context.api.query.swaps;
      }
    },
    {
      enabled: Boolean(sdk),
    },
  );
};
