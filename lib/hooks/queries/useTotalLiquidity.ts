import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";
import { calcLiqudityFromPoolAssets } from "lib/util/calc-liquidity";

export const rootKey = "total-liquidity";

export const useTotalLiquidity = () => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, rootKey],
    async () => {
      const pools = await sdk.model.swaps.listPools({});
      const total =
        pools?.reduce((acc, pool) => {
          return acc.plus(calcLiqudityFromPoolAssets(pool.assets as any));
        }, new Decimal(0)) ?? new Decimal(0);

      return total;
    },
    {
      enabled: Boolean(sdk),
    },
  );
};
