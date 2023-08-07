export const formatNumberCompact = (
  number: number | bigint,
  maximumSignificantDigits = 3,
) => {
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: maximumSignificantDigits,
    notation: "compact",
  }).format(number);
};
