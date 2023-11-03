import Decimal from "decimal.js";

// buy outcome token with the base asset
export const calculateSwapAmountOutForBuy = (
  reserve: Decimal, // amount of asset you want to buy in the pool
  amountIn: Decimal, // amount you want to spend
  liquidity: Decimal, // liqudity parameter of the pool
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
    .minus(amountIn)
    .plus(amountIn);
};

// sell outcome token for the base asset
export const calculateSwapAmountOutForSell = (
  reserve: Decimal, // amount of asset you want to sell in the pool
  amountIn: Decimal, // amount of asset to sell
  liquidity: Decimal, // liqudity parameter of the pool
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

export const calculateSpotPrice = (
  reserve: Decimal, // amount of asset in the pool
  liquidity: Decimal, // liqudity parameter of the pool
) => {
  return new Decimal(0).minus(reserve).div(liquidity).exp();
};

export const approximateMaxAmountInForBuy = (
  reserve: Decimal, // amount of asset in the pool
  liquidity: Decimal, // liqudity parameter of the pool
) => {
  const price = calculateSpotPrice(reserve, liquidity).toNumber();

  return liquidity.mul(
    0.99 *
      (-10015.14417168339605268557 * price ** 10 +
        46175.29901770254946313798 * price ** 9 -
        90642.29890720185358077288 * price ** 8 +
        98754.41788689797976985574 * price ** 7 -
        65270.04041910833620931953 * price ** 6 +
        26866.82939015745796496049 * price ** 5 -
        6805.08835771731082786573 * price ** 4 +
        1008.86080878299947016785 * price ** 3 -
        79.48474558820969093631 * price ** 2 +
        1.45265602009115950999 * price ** 1 +
        4.5837281790982524754),
  );
};

export const approximateMaxAmountInForSell = (
  reserve: Decimal, // amount of asset in the pool
  liquidity: Decimal, // liqudity parameter of the pool
) => {
  const price = calculateSpotPrice(reserve, liquidity).toNumber();

  return liquidity.mul(
    0.99 *
      (6027.48739001329704478849 * price ** 10 -
        23943.83771737971983384341 * price ** 9 +
        36748.94249659497290849686 * price ** 8 -
        24233.23433796403696760535 * price ** 7 +
        453.48665119856707406143 * price ** 6 +
        10032.97899602322468126658 * price ** 5 -
        7080.22041420203277084511 * price ** 4 +
        2410.0255212617116740148 * price ** 3 -
        459.95159954049660200326 * price ** 2 +
        54.14308593643040978804 * price ** 1 -
        0.538594836861739279),
  );
};
