import { useQuery } from "@tanstack/react-query";
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
      const saturatedData = saturatedIndex?.[pool.poolId];
      if (
        saturatedData &&
        saturatedData.market.status === "Active" &&
        saturatedData.liquidity
      ) {
        return acc.plus(saturatedData.liquidity);
      }
      return acc;
    }, new Decimal(0)) ?? new Decimal(0);

  return total;
};
