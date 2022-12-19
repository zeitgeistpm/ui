import Decimal from "decimal.js";

export const calcScalarWinnings = (
  lowerBound: number | Decimal,
  upperBound: number | Decimal,
  resolvedNumber: number | Decimal,
  shortAssetAmount: number | Decimal,
  longAssetAmount: number | Decimal,
) => {
  const priceRange = new Decimal(upperBound).minus(lowerBound);
  const resolvedNumberAsPercentage = new Decimal(resolvedNumber)
    .minus(lowerBound)
    .div(priceRange);
  const longTokenValue = resolvedNumberAsPercentage;
  const shortTokenValue = new Decimal(1).minus(resolvedNumberAsPercentage);
  const longRewards = new Decimal(longAssetAmount).mul(longTokenValue);
  const shortRewards = new Decimal(shortAssetAmount).mul(shortTokenValue);

  return new Decimal(longRewards).plus(shortRewards);
};
