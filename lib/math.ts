import { Decimal } from "decimal.js";

export const calcRelativeDiff = (expected, actual) => {
  return new Decimal(expected).minus(new Decimal(actual)).div(expected).abs();
};

export const calcSpotPrice = (
  tokenBalanceIn,
  tokenWeightIn,
  tokenBalanceOut,
  tokenWeightOut,
  swapFee,
) => {
  const numer = new Decimal(tokenBalanceIn).div(new Decimal(tokenWeightIn));
  const denom = new Decimal(tokenBalanceOut).div(new Decimal(tokenWeightOut));
  const ratio = numer.div(denom);
  const scale = new Decimal(1).div(new Decimal(1).sub(new Decimal(swapFee)));
  const spotPrice = ratio.mul(scale);
  return spotPrice;
};

export const calcOutGivenIn = (
  tokenBalanceIn, // amount of 'in' asset in the pool
  tokenWeightIn, // weight of 'in' asset on the pool
  tokenBalanceOut, // amount of 'out' asset in the pool
  tokenWeightOut, // weight of 'out' asset on the pool
  tokenAmountIn, // amount in for the swap
  swapFee,
) => {
  const weightRatio = new Decimal(tokenWeightIn).div(
    new Decimal(tokenWeightOut),
  );
  const adjustedIn = new Decimal(tokenAmountIn).times(
    new Decimal(1).minus(new Decimal(swapFee)),
  );
  const y = new Decimal(tokenBalanceIn).div(
    new Decimal(tokenBalanceIn).plus(adjustedIn),
  );
  const foo = y.pow(weightRatio);
  const bar = new Decimal(1).minus(foo);
  const tokenAmountOut = new Decimal(tokenBalanceOut).times(bar);
  return tokenAmountOut;
};

export const calcInGivenOut = (
  tokenBalanceIn,
  tokenWeightIn,
  tokenBalanceOut,
  tokenWeightOut,
  tokenAmountOut,
  swapFee,
) => {
  console.log({
    tokenBalanceIn: new Decimal(tokenBalanceIn).toNumber(),
    tokenWeightIn: new Decimal(tokenWeightIn).toNumber(),
    tokenBalanceOut: new Decimal(tokenBalanceOut).toNumber(),
    tokenWeightOut: new Decimal(tokenWeightOut).toNumber(),
    tokenAmountOut: new Decimal(tokenAmountOut).toNumber(),
    swapFee: new Decimal(swapFee).toNumber(),
  });
  const weightRatio = new Decimal(tokenWeightOut).div(
    new Decimal(tokenWeightIn),
  );
  const diff = new Decimal(tokenBalanceOut).minus(tokenAmountOut);
  const y = new Decimal(tokenBalanceOut).div(diff);
  const foo = y.pow(weightRatio).minus(new Decimal(1));
  const tokenAmountIn = new Decimal(tokenBalanceIn)
    .times(foo)
    .div(new Decimal(1).minus(new Decimal(swapFee)));
  return tokenAmountIn;
};

export const calcPoolOutGivenSingleIn = (
  tokenBalanceIn,
  tokenWeightIn,
  poolSupply,
  totalWeight,
  tokenAmountIn,
  swapFee,
) => {
  const normalizedWeight = new Decimal(tokenWeightIn).div(
    new Decimal(totalWeight),
  );
  const zaz = new Decimal(1)
    .sub(new Decimal(normalizedWeight))
    .mul(new Decimal(swapFee));
  const tokenAmountInAfterFee = new Decimal(tokenAmountIn).mul(
    new Decimal(1).sub(zaz),
  );
  const newTokenBalanceIn = new Decimal(tokenBalanceIn).add(
    tokenAmountInAfterFee,
  );
  const tokenInRatio = newTokenBalanceIn.div(new Decimal(tokenBalanceIn));
  const poolRatio = tokenInRatio.pow(normalizedWeight);
  const newPoolSupply = poolRatio.mul(new Decimal(poolSupply));
  const poolAmountOut = newPoolSupply.sub(new Decimal(poolSupply));
  return poolAmountOut;
};

export const calcSingleInGivenPoolOut = (
  tokenBalanceIn,
  tokenWeightIn,
  poolSupply,
  totalWeight,
  poolAmountOut,
  swapFee,
) => {
  const normalizedWeight = new Decimal(tokenWeightIn).div(
    new Decimal(totalWeight),
  );
  const newPoolSupply = new Decimal(poolSupply).plus(
    new Decimal(poolAmountOut),
  );
  const poolRatio = newPoolSupply.div(new Decimal(poolSupply));
  const boo = new Decimal(1).div(normalizedWeight);
  const tokenInRatio = poolRatio.pow(boo);
  const newTokenBalanceIn = tokenInRatio.mul(new Decimal(tokenBalanceIn));
  const tokenAmountInAfterFee = newTokenBalanceIn.sub(
    new Decimal(tokenBalanceIn),
  );
  const zar = new Decimal(1).sub(normalizedWeight).mul(new Decimal(swapFee));
  const tokenAmountIn = tokenAmountInAfterFee.div(new Decimal(1).sub(zar));
  return tokenAmountIn;
};

export const calcSingleOutGivenPoolIn = (
  tokenBalanceOut,
  tokenWeightOut,
  poolSupply,
  totalWeight,
  poolAmountIn,
  swapFee,
) => {
  const normalizedWeight = new Decimal(tokenWeightOut).div(
    new Decimal(totalWeight),
  );
  const poolAmountAfterExitFee = new Decimal(poolAmountIn).mul(
    new Decimal(1).sub(0),
  );
  const newPoolSupply = new Decimal(poolSupply).sub(poolAmountAfterExitFee);
  const poolRatio = newPoolSupply.div(new Decimal(poolSupply));

  const tokenOutRAtio = poolRatio.pow(new Decimal(1).div(normalizedWeight));
  const newTokenBalanceOut = tokenOutRAtio.mul(new Decimal(tokenBalanceOut));

  const tokenAmountBeforeSwapFee = new Decimal(tokenBalanceOut).sub(
    newTokenBalanceOut,
  );

  const zaz = new Decimal(swapFee).mul(new Decimal(1).sub(normalizedWeight));
  const tokenAmountOut = tokenAmountBeforeSwapFee.mul(new Decimal(1).sub(zaz));
  return tokenAmountOut;
};

export const calcPoolTokensByRatio = (ratio: Decimal, totalShares: Decimal) => {
  return new Decimal(ratio).mul(totalShares);
};
