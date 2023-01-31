import Decimal from "decimal.js";

export const calcScalarWinnings = (
  lowerBound: number | Decimal,
  upperBound: number | Decimal,
  resolvedNumber: number | Decimal,
  shortAssetAmount: number | Decimal,
  longAssetAmount: number | Decimal,
) => {
  const { longTokenValue, shortTokenValue } = calcScalarResolvedPrices(
    lowerBound,
    upperBound,
    resolvedNumber,
  );
  const longRewards = new Decimal(longAssetAmount).mul(longTokenValue);
  const shortRewards = new Decimal(shortAssetAmount).mul(shortTokenValue);

  return new Decimal(longRewards).plus(shortRewards);
};

export const calcScalarResolvedPrices = (
  lowerBound: number | Decimal,
  upperBound: number | Decimal,
  resolvedNumber: number | Decimal,
): {
  longTokenValue: Decimal;
  shortTokenValue: Decimal;
} => {
  const priceRange = new Decimal(upperBound).minus(lowerBound);
  const resolvedNumberAsPercentage = new Decimal(resolvedNumber)
    .minus(lowerBound)
    .div(priceRange);

  const longTokenValue = resolvedNumberAsPercentage;
  const shortTokenValue = new Decimal(1).minus(resolvedNumberAsPercentage);

  return { longTokenValue, shortTokenValue };
};
