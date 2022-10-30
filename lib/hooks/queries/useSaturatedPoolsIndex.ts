import { useQuery } from "@tanstack/react-query";
import { Context, Pool } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "saturated-pools-index";

export const key = (pools?: Pool<Context>[]) => [
  rootKey,
  ...(pools?.map(({ poolId }) => poolId).sort() || []),
];

export const useSaturatedPoolsIndex = (pools?: Pool<Context>[]) => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, ...key(pools)],
    async () => {
      return sdk.model.swaps.saturatedPoolsIndex(pools);
    },
    {
      enabled: Boolean(sdk) && Boolean(pools),
    },
  );
};
