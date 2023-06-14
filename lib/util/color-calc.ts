export const calcMarketColors = (marketId: number, assetsLength: number) => {
  return Array.from({ length: assetsLength }, (_, i) =>
    calcColor(marketId, assetsLength, i),
  );
};

export const calcColor = (
  marketId: number,
  assetsLength: number,
  assetIndex: number,
) => {
  const startingPoint = marketId % 360;
  const assetSpacing = 360 / assetsLength;
  const hue = startingPoint + assetSpacing * assetIndex;

  const saturation = 100;
  const lightness = 50;

  return hslToHex(hue, saturation, lightness);
};

export const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
