import Decimal from "decimal.js";

export const calculateSwapAmountOutForBuy = (
  reserve: Decimal, // amount of asset you want to buy in the pool
  amountIn: Decimal, // amount you want to spend
  liquidity: Decimal,
  poolFee: Decimal, // 1% is 0.01
  creatorFee: Decimal, // 1% is 0.01
) => {
  // remove the fees before executing the buy
  const totalFee = poolFee.plus(creatorFee);
  const feeMultiplier = new Decimal(1).minus(totalFee);
  const amountInMinusFees = amountIn.mul(feeMultiplier);

  const exp1 = amountInMinusFees.div(liquidity).exp();
  const exp2 = new Decimal(0).minus(reserve.div(liquidity)).exp();

  return exp1
    .minus(new Decimal(1))
    .plus(exp2)
    .ln()
    .mul(liquidity)
    .plus(reserve)
    .minus(amountIn);
};

export const calculateSwapAmountOutForSell = (
  reserve: Decimal, // amount of asset you want to sell in the pool
  amountIn: Decimal, //amount of asset to sell
  liquidity: Decimal,
  poolFee: Decimal, // 1% is 0.01
  creatorFee: Decimal, // 1% is 0.01
) => {
  const exp1 = amountIn.plus(reserve).div(liquidity).exp();
  const exp2 = amountIn.div(liquidity).exp();

  const amountOut = exp1
    .minus(exp2)
    .plus(1)
    .ln()
    .mul(liquidity)
    .mul(-1)
    .plus(reserve)
    .plus(amountIn);

  // remove the fees after executing the sell
  const totalFee = poolFee.plus(creatorFee);
  const feeMultiplier = new Decimal(1).minus(totalFee);
  return amountOut.mul(feeMultiplier);
};
