import { Amm2Pool } from "lib/hooks/queries/amm2/useAmm2Pool";

/**
 * Determines the correct pool identifier to use for neoSwaps extrinsics.
 *
 * - Combinatorial markets: Use pool.poolId (different from marketId)
 * - Legacy markets: Use marketId (poolId equals marketId for legacy markets)
 *
 * @param pool - The AMM2 pool object
 * @param marketId - The market ID
 * @returns The correct pool identifier to use in neoSwaps transactions
 */
export const getPoolIdForTransaction = (
  pool: Amm2Pool,
  marketId: number,
): number => {
  // Check if this is a combinatorial market
  const isCombinatorialMarket = pool.poolType?.combinatorial != null;

  // Combinatorial markets use poolId, legacy markets use marketId
  return isCombinatorialMarket ? pool.poolId : marketId;
};
