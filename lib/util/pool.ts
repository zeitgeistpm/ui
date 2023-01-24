import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";
import { calcInGivenOut, calcOutGivenIn } from "lib/math";
import { CPool } from "lib/stores/PoolsStore";

export const extractSwapWeights = (
  pool: Swap,
  assetId: AssetId,
  baseAsset: string,
) => {
  const assetString = JSON.stringify(assetId);

  const assetWeight = new Decimal(pool.weights.value.toJSON()[assetString]);
  const baseWeight = new Decimal(pool.weights.value.toJSON()[baseAsset]);

  return { assetWeight, baseWeight };
};

export const calcTotalAssetPrice = (pool: CPool) => {
  const totalPrice = pool?.assets
    .map((asset) => (asset.id != null ? asset.price : 0))
    .reduce((prev, acc) => acc + prev, 0);

  return isNaN(totalPrice) ? 1 : totalPrice;
};

export const generateSwapExactAmountOutTx = (
  api: any, // should be of type ApiPromise
  tokenIn: AssetId,
  tokenOut: AssetId,
  tokenBalanceIn: Decimal,
  tokenWeightIn: Decimal,
  tokenBalanceOut: Decimal,
  tokenWeightOut: Decimal,
  tokenAmountOut: Decimal,
  swapFee: Decimal,
  slippage: Decimal, //passed as decimal, eg 1% slippage should be 0.01
  poolId: number,
) => {
  const maxAmountIn = calcInGivenOut(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    tokenAmountOut,
    swapFee,
  );

  const maxAmountInWithSlippage = maxAmountIn.mul(slippage.plus(1));

  return api.tx.swaps.swapExactAmountOut(
    poolId,
    tokenIn,
    maxAmountInWithSlippage.toFixed(0),
    tokenOut,
    tokenAmountOut.toFixed(0),
    null,
  );
};

export const generateSwapExactAmountInTx = (
  api: any, // should be of type ApiPromise
  tokenIn: AssetId,
  tokenOut: AssetId,
  tokenBalanceIn: Decimal,
  tokenWeightIn: Decimal,
  tokenBalanceOut: Decimal,
  tokenWeightOut: Decimal,
  tokenAmountIn: Decimal,
  swapFee: Decimal,
  slippage: Decimal, //passed as decimal, eg 1% slippage should be 0.01
  poolId: number,
) => {
  const minAmountOut = calcOutGivenIn(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    tokenAmountIn,
    swapFee,
  );

  const minAmountOutWithSlippage = minAmountOut.mul(
    new Decimal(1).minus(slippage),
  );

  return api.tx.swaps.swapExactAmountIn(
    poolId,
    tokenIn,
    tokenAmountIn.toFixed(0),
    tokenOut,
    minAmountOutWithSlippage.toFixed(0),
    null,
  );
};
