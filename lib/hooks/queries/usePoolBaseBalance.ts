import { parseAssetId } from "@zeitgeistpm/sdk-next";
import { useBalance } from "./useBalance";
import { usePool } from "./usePool";

export const usePoolBaseBalance = (poolId?: number, blockNumber?: number) => {
  const { data: pool } = usePool({ poolId });

  const balanceQuery = useBalance(
    pool?.accountId,
    pool?.baseAsset ? parseAssetId(pool.baseAsset).unwrap() : undefined,
    blockNumber,
  );

  return balanceQuery;
};
