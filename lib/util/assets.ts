import { getIndexOf, ZTG, MarketOutcomeAssetId } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { parseAssetIdString, parseAssetIdStringWithCombinatorial } from "./parse-asset-id";
import { isCombinatorialToken } from "../types/combinatorial";

export const getCurrentPrediction = (
  assets: { price: number; assetId?: string }[],
  market: {
    marketType: {
      categorical?: string | null;
      scalar?: (string | null)[] | null;
    };
    categories?: ({ name?: string | null } | null)[] | null;
  },
): { name: string; price: number; percentage: number } => {
  const totalPrice = assets.reduce((acc, asset) => acc + asset.price, 0);

  if (assets?.length < 2) {
    return { name: "N/A", price: 0, percentage: 0 };
  }

  if (market?.marketType?.categorical) {
    let [highestPrice, highestPriceIndex] = [0, 0];
    
    // Sort assets by their index, handling both regular assets and combinatorial tokens
    assets.sort((a, b) => {
      const assetA = parseAssetIdStringWithCombinatorial(a?.assetId || "");
      const assetB = parseAssetIdStringWithCombinatorial(b?.assetId || "");
      
      // If both are combinatorial tokens, preserve original order
      if (isCombinatorialToken(assetA) && isCombinatorialToken(assetB)) {
        return 0;
      }
      
      // If only one is combinatorial, put combinatorial tokens last
      if (isCombinatorialToken(assetA)) return 1;
      if (isCombinatorialToken(assetB)) return -1;
      
      // Both are regular market outcome assets, use getIndexOf
      return getIndexOf(assetA as MarketOutcomeAssetId) - getIndexOf(assetB as MarketOutcomeAssetId);
    });

    assets.forEach((asset, index) => {
      if (asset.price > highestPrice) {
        highestPrice = asset.price;
        highestPriceIndex = index;
      }
    });

    const percentage = Math.round((highestPrice / totalPrice) * 100);

    return {
      name:
        market.categories == null
          ? ""
          : market.categories[highestPriceIndex]?.name ?? "",
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
