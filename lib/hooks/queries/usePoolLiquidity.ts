import { useQuery } from "@tanstack/react-query";
import { PoolGetQuery } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { usePool } from "./usePool";
import { useSaturatedPoolsIndex } from "./useSaturatedPoolsIndex";

export const poolsLiqudityRootKey = "pool-liquidity";

export const usePoolLiquidity = (getPoolQuery?: PoolGetQuery) => {
  const [sdk, id] = useSdkv2();
  const { data: pool } = usePool(getPoolQuery);

  const { data: saturatedPoolIndex } = useSaturatedPoolsIndex(
    pool ? [pool] : undefined,
  );

  const saturatedPoolData = saturatedPoolIndex?.[pool.poolId];

  const query = useQuery(
    [id, poolsLiqudityRootKey, getPoolQuery],
    async () => {
      return saturatedPoolData.liquidity;
    },
    {
      enabled: Boolean(sdk && saturatedPoolIndex && saturatedPoolData),
    },
  );

  return query;
};
