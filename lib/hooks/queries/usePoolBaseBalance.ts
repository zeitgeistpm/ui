import { useBalance } from "./useBalance";
import { usePool } from "./usePool";

export const usePoolBaseBalance = (poolId: number, blockNumber?: number) => {
  const { data: pool } = usePool({ poolId });
  //todo: update this once we know the formatting on the indexer
  const balanceQuery = useBalance(pool?.accountId, { Ztg: null }, blockNumber);

  return balanceQuery;
};
