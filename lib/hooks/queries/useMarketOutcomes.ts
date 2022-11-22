import { PoolGetQuery, SaturatedPoolEntryAsset } from "@zeitgeistpm/sdk-next";
import { useEffect, useMemo, useState } from "react";
import { useSdkv2 } from "../useSdkv2";
import { usePool } from "./usePool";
import { useSaturatedPoolsIndex } from "./useSaturatedPoolsIndex";

export const useMarketOutcomes = (
  getPoolQuery: PoolGetQuery,
  refetchInterval?: number,
) => {
  const { data: pool } = usePool(getPoolQuery);
  const [res, setRes] = useState<SaturatedPoolEntryAsset[]>();

  const { data: saturatedPoolIndex } = useSaturatedPoolsIndex(
    pool ? [pool] : undefined,
    refetchInterval,
  );

  useEffect(() => {
    setRes(saturatedPoolIndex?.[pool.poolId].assets);
  }, [saturatedPoolIndex]);

  return res;
};
