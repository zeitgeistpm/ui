import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isIndexedData } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "total-liquidity";

export const useTotalLiquidity = (options: { enabled: boolean }) => {
  const [sdk, id] = useSdkv2();

  const { data: pools } = useQuery(
    [id, rootKey, "pools"],
    () => sdk.model.swaps.listPools({}),
    {
      enabled: options.enabled && Boolean(sdk),
    },
  );

  const { data: saturatedIndex } = useQuery(
    [id, rootKey, "saturated-index"],
    async () => {
      return sdk.model.swaps.saturatedPoolsIndex(pools);
    },
    {
      enabled: options.enabled && Boolean(sdk) && Boolean(pools),
    },
  );

  const total =
    pools?.reduce((acc, pool) => {
      const indexed = saturatedIndex?.[pool.poolId];
      if (
        indexed &&
        "status" in indexed.market &&
        indexed.market.status === "Active"
      ) {
        const liquidity = indexed?.liquidity || new Decimal(0);
        return acc.plus(liquidity);
      }
      return acc;
    }, new Decimal(0)) ?? new Decimal(0);

  return total;
};
