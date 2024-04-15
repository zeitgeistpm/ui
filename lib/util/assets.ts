import {
  getIndexOf,
  ZTG,
  MarketOutcomeAssetId,
  AssetId,
} from "@zeitgeistpm/sdk";
import { FullAssetFragment, FullMarketFragment } from "@zeitgeistpm/indexer";

import Decimal from "decimal.js";
import { parseAssetIdString } from "./parse-asset-id";
import { assetsAreEqual } from "./assets-are-equal";

export const getCurrentPrediction = (
  assets: { price: number; assetId?: string | null; name?: string | null }[],
  market: {
    marketType: {
      categorical?: string | null;
      scalar?: (string | null)[] | null;
    };
  },
): { name: string; price: number; percentage: number } => {
  const totalPrice = assets.reduce((acc, asset) => acc + asset.price, 0);

  if (assets?.length < 2) {
    return { name: "N/A", price: 0, percentage: 0 };
  }

  if (market?.marketType?.categorical) {
    let [highestPrice, highestPriceIndex] = [0, 0];

    assets.forEach((asset, index) => {
      if (asset.price > highestPrice) {
        highestPrice = asset.price;
        highestPriceIndex = index;
      }
    });

    const percentage = Math.round((highestPrice / totalPrice) * 100);

    return {
      name: assets[highestPriceIndex].name ?? "",
      price: highestPrice,
      percentage,
    };
  } else {
    const bounds: number[] =
      market?.marketType?.scalar?.map((b) => Number(b)) ?? [];

    const range = bounds[1] - bounds[0];
    const longPrice = assets[0].price;
    const shortPrice = assets[1].price;

    const shortPricePrediction = range * (1 - shortPrice) + bounds[0];
    const longPricePrediction = range * longPrice + bounds[0];
    const averagePricePrediction =
      (longPricePrediction + shortPricePrediction) / 2;

    const percentage = Math.round((averagePricePrediction / totalPrice) * 100);

    return {
      name: new Decimal(averagePricePrediction).div(ZTG).toString(),
      price: averagePricePrediction,
      percentage,
    };
  }
};

export const findAsset = (
  assetId: AssetId | undefined,
  assets: FullMarketFragment["assets"],
) => {
  const asset = assets.find((asset) => {
    const a = parseAssetIdString(asset.assetId);
    assetsAreEqual(a, assetId);
  });

  return asset;
};
