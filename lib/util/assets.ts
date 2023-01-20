import {
  fromCompositeIndexerAssetId,
  getIndexOf,
  ZTG,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";

export const getCurrentPrediction = (
  assets: { price: number; assetId?: string }[],
  market: {
    marketType: { categorical?: string; scalar?: string[] };
    categories: { color: string; name: string; ticker: string }[];
  },
): string => {
  if (market.marketType.categorical) {
    let [highestPrice, highestPriceIndex] = [0, 0];

    assets.sort(
      (a, b) =>
        getIndexOf(fromCompositeIndexerAssetId(a.assetId).unwrap()) -
        getIndexOf(fromCompositeIndexerAssetId(b.assetId).unwrap()),
    );

    assets.forEach((asset, index) => {
      if (asset.price > highestPrice) {
        highestPrice = asset.price;
        highestPriceIndex = index;
      }
    });

    return market.categories[highestPriceIndex].name;
  } else {
    const bounds: number[] = market.marketType.scalar.map((b) => Number(b));

    const range = bounds[1] - bounds[0];
    const longPrice = assets[0].price;
    const shortPrice = assets[1].price;

    const shortPricePrediction = range * (1 - shortPrice) + bounds[0];
    const longPricePrediction = range * longPrice + bounds[0];
    const averagePricePrediction =
      (longPricePrediction + shortPricePrediction) / 2;

    return new Decimal(averagePricePrediction).div(ZTG).toString();
  }
};
