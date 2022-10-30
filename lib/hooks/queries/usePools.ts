import { useQuery } from "@tanstack/react-query";
import { sortBy } from "lodash";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pools";

export const usePools = () => {
  const [sdk, id] = useSdkv2();
  console.log(id, sdk);
  return useQuery(
    [id, rootKey],
    async () => {
      console.log("fetching pool");
      const pools = await sdk.model.swaps.listPools({});
      console.log(pools);
      return sortBy(pools, "poolId", "desc").reverse();
    },
    {
      enabled: Boolean(sdk),
    },
  );
};
