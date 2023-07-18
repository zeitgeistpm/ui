import { parseAssetId } from "@zeitgeistpm/sdk-next";
import { useBalance } from "./useBalance";
import { usePool } from "./usePool";

export const usePoolBaseBalance = (poolId?: number, blockNumber?: number) => {
  const { data: pool } = usePool(poolId != null ? { poolId } : undefined);

  const balanceQuery = useBalance(
    pool?.account.accountId,
    pool?.baseAsset ? parseAssetId(pool.baseAsset).unwrap() : undefined,
    blockNumber,
  );

  return balanceQuery;
};
