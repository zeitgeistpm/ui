import { useQuery } from "@tanstack/react-query";
import { sortBy } from "lodash";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pools";

export const usePools = () => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, rootKey],
    async () => {
      const pools = await sdk.model.swaps.listPools({});
      return sortBy(pools, "poolId", "desc").reverse();
    },
    {
      enabled: Boolean(sdk),
    },
  );
};
