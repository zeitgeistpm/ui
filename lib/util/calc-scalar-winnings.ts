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

  const longTokenValue = constrainValue(resolvedNumberAsPercentage);
  const shortTokenValue = constrainValue(
    new Decimal(1).minus(resolvedNumberAsPercentage),
  );

  return { longTokenValue, shortTokenValue };
};

const constrainValue = (value: Decimal): Decimal => {
  if (value.greaterThan(1)) {
    return new Decimal(1);
  } else if (value.lessThan(0)) {
    return new Decimal(0);
  } else {
    return value;
  }
};
