export const formatNumberCompact = (
  num: number | bigint,
  maximumSignificantDigits = 3,
) => {
  // Ensure displaying absolute zeros are unsigned(-), because javascript sucks sometimes.
  if (num === 0 || num === 0n) num = 0;

  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: maximumSignificantDigits,
    notation: "compact",
  }).format(num);
};
