import Decimal from "decimal.js";

export const calcWeightGivenSpotPrice = (
  tokenBalanceIn: Decimal,
  tokenWeightIn: Decimal,
  tokenBalanceOut: Decimal,
  spotPrice: Decimal,
): Decimal => {
  const numerator = spotPrice.mul(tokenWeightIn).mul(tokenBalanceOut);
  const tokenWeightOut = numerator.div(tokenBalanceIn);
  return tokenWeightOut;
};

export type PriceLock = {
  price: Decimal;
  locked: boolean;
};

export const calcPrices = (prices: PriceLock[]): PriceLock[] => {
  const lockedPrices = calcLockedPriceTotal(prices);
  const remainingPrice = new Decimal(1).minus(lockedPrices.total);
  const unlockedAssetsCount = prices.length - lockedPrices.count;
  const distributedPrice = remainingPrice.div(unlockedAssetsCount);
  const newPrices = prices.map((price) => {
    return {
      ...price,
      price:
        price.locked === true
          ? price.price
          : distributedPrice.greaterThan(0)
            ? distributedPrice
            : new Decimal(0),
    };
  });

  return newPrices;
};

export const calcLockedPriceTotal = (
  prices: PriceLock[],
): {
  total: Decimal;
  count: number;
} => {
  return prices.reduce(
    (acc, curr) => {
      return curr.locked === true
        ? { total: acc.total.plus(curr.price), count: acc.count + 1 }
        : acc;
    },
    { total: new Decimal(0), count: 0 },
  );
};
