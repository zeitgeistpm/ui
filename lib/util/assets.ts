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
): { name: string; price: number } => {
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

    return {
      name: market.categories[highestPriceIndex].name,
      price: highestPrice,
    };
  } else {
    const bounds: number[] = market.marketType.scalar.map((b) => Number(b));

    const range = bounds[1] - bounds[0];
    const longPrice = assets[0].price;
    const shortPrice = assets[1].price;

    const shortPricePrediction = range * (1 - shortPrice) + bounds[0];
    const longPricePrediction = range * longPrice + bounds[0];
    const averagePricePrediction =
      (longPricePrediction + shortPricePrediction) / 2;

    return {
      name: new Decimal(averagePricePrediction).div(ZTG).toString(),
      price: averagePricePrediction,
    };
  }
};
