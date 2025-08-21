import { MarketOutcomeAssetId, IOMarketOutcomeAssetId } from "@zeitgeistpm/sdk";
import { CombinatorialToken, isCombinatorialToken } from "lib/types/combinatorial";

/**
 * Sorts assets (particularly combinatorial tokens) to match the order in market.outcomeAssets
 * This ensures consistent ordering across the UI
 */
export const sortAssetsByMarketOrder = (
  assets: (MarketOutcomeAssetId | CombinatorialToken)[],
  marketOutcomeAssets?: any[]
): (MarketOutcomeAssetId | CombinatorialToken)[] => {
  if (!marketOutcomeAssets || assets.length === 0) {
    return assets;
  }

  // Check if we need to sort (only if there are combinatorial tokens)
  const hasCombinatorialTokens = assets.some(asset => !IOMarketOutcomeAssetId.is(asset));
  if (!hasCombinatorialTokens) {
    return assets;
  }

  return [...assets].sort((a, b) => {
    // Only sort combinatorial tokens
    if (IOMarketOutcomeAssetId.is(a) || IOMarketOutcomeAssetId.is(b)) {
      return 0;
    }

    const aIndex = findAssetIndex(a, marketOutcomeAssets);
    const bIndex = findAssetIndex(b, marketOutcomeAssets);

    // If not found, maintain original order
    if (aIndex === -1 || bIndex === -1) {
      return 0;
    }

    return aIndex - bIndex;
  });
};

/**
 * Sorts categories to match market.outcomeAssets order for combinatorial markets
 * Returns sorted categories along with reordered spot prices and price changes
 */
export const sortCategoriesByMarketOrder = (
  categories: any[],
  spotPrices: Map<number, any> | undefined,
  priceChanges: Map<number, any> | undefined,
  marketOutcomeAssets?: any[]
) => {
  if (!categories || !marketOutcomeAssets || !spotPrices) {
    return {
      orderedCategories: categories,
      orderedSpotPrices: spotPrices,
      orderedPriceChanges: priceChanges
    };
  }

  // Check if it's a combinatorial market
  const isCombinatorialMarket = marketOutcomeAssets.some((asset: any) =>
    typeof asset === 'string' && asset.includes('combinatorialToken')
  );

  if (!isCombinatorialMarket) {
    return {
      orderedCategories: categories,
      orderedSpotPrices: spotPrices,
      orderedPriceChanges: priceChanges
    };
  }

  // Create category mapping based on market.outcomeAssets order
  const categoriesWithIndices = categories.map((category, originalIndex) => ({
    category,
    originalIndex,
    marketIndex: findCategoryInMarketAssets(category, marketOutcomeAssets)
  }));

  // Sort by market index
  const sortedCategories = categoriesWithIndices
    .sort((a, b) => a.marketIndex - b.marketIndex)
    .map(item => item.category);

  // Reorder spot prices and price changes to match sorted categories
  const newSpotPrices = new Map();
  const newPriceChanges = new Map();

  categoriesWithIndices
    .sort((a, b) => a.marketIndex - b.marketIndex)
    .forEach((item, newIndex) => {
      newSpotPrices.set(newIndex, spotPrices.get(item.originalIndex));
      if (priceChanges) {
        newPriceChanges.set(newIndex, priceChanges.get(item.originalIndex));
      }
    });

  return {
    orderedCategories: sortedCategories,
    orderedSpotPrices: newSpotPrices,
    orderedPriceChanges: newPriceChanges
  };
};

/**
 * Finds the index of a combinatorial token in market.outcomeAssets array
 */
const findAssetIndex = (
  asset: CombinatorialToken,
  marketOutcomeAssets: any[]
): number => {
  return marketOutcomeAssets.findIndex(marketAsset => {
    // Handle string representation
    if (typeof marketAsset === 'string') {
      // Simple includes check for the token hash
      if (marketAsset.includes(asset.CombinatorialToken)) {
        return true;
      }
      
      // Try parsing as JSON for more complex structures
      try {
        const parsed = JSON.parse(marketAsset);
        return parsed.combinatorialToken === asset.CombinatorialToken ||
               parsed.CombinatorialToken === asset.CombinatorialToken;
      } catch {
        return false;
      }
    }
    
    // Handle object representation
    if (marketAsset && typeof marketAsset === 'object') {
      return marketAsset.combinatorialToken === asset.CombinatorialToken ||
             marketAsset.CombinatorialToken === asset.CombinatorialToken ||
             JSON.stringify(marketAsset).includes(asset.CombinatorialToken);
    }
    
    return false;
  });
};

/**
 * Finds the index of a category in market.outcomeAssets array
 */
const findCategoryInMarketAssets = (
  category: any,
  marketOutcomeAssets: any[]
): number => {
  const categoryName = category?.name || category;
  
  const index = marketOutcomeAssets.findIndex((marketAsset: any) => {
    if (typeof marketAsset === 'string') {
      return marketAsset.includes(categoryName) || JSON.stringify(marketAsset).includes(categoryName);
    }
    return JSON.stringify(marketAsset).includes(categoryName);
  });
  
  // Return the found index, or the original index if not found
  return index !== -1 ? index : marketOutcomeAssets.length;
};