export const calcScalarWinnings = (
  lowerBound: number,
  upperBound: number,
  resolvedNumber: number,
  shortAssetAmount: number,
  longAssetAmount: number,
) => {
  const priceRange = upperBound - lowerBound;
  const resolvedNumberAsPercentage = (resolvedNumber - lowerBound) / priceRange;
  const longTokenValue = resolvedNumberAsPercentage;
  const shortTokenValue = 1 - resolvedNumberAsPercentage;
  const longRewards = longAssetAmount * longTokenValue;
  const shortRewards = shortAssetAmount * shortTokenValue;

  return longRewards + shortRewards;
};
