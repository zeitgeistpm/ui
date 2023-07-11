export interface MultipleOutcomeEntry {
  name: string;
  ticker: string;
  color: string;
}

export type MarketImageCid = string;
export type MarketImageBase64Encoded = string;

export type MarketImageString = MarketImageCid | MarketImageBase64Encoded;

export const isMarketImageBase64Encoded = (
  image: string,
): image is MarketImageBase64Encoded => {
  return image.startsWith("data:image");
};
