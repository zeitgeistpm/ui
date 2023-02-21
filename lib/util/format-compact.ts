export const formatNumberCompact = (number: number | bigint) => {
  return new Intl.NumberFormat("default", {
    maximumSignificantDigits: 3,
    notation: "compact",
  }).format(number);
};
