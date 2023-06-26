export const formatNumberCompact = (number: number | bigint | string) => {
  if (typeof number === "string") {
    number = Number(number);
  }
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 3,
    notation: "compact",
  }).format(number);
};
