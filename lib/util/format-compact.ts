export const formatNumberCompact = (
  num: number | bigint,
  maximumSignificantDigits = 3,
) => {
  const userLocale = navigator.language || "en-US";
  // Ensure displaying absolute zeros are unsigned(-), because javascript sucks sometimes.
  if (num === 0 || num === 0n) num = 0;

  return new Intl.NumberFormat(userLocale, {
    maximumSignificantDigits: maximumSignificantDigits,
    notation: "compact",
  }).format(num);
};
