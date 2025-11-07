import { MarketOutcomeAssetId } from "@zeitgeistpm/sdk";
import { CombinatorialToken, isCombinatorialToken } from "lib/types/combinatorial";

export const filterMarketRelevantAssets = (
  poolAssets: (MarketOutcomeAssetId | CombinatorialToken)[] | undefined,
  marketOutcomeAssets: string[] | undefined,
  parsedOutcomeAssets: MarketOutcomeAssetId[] | undefined
): (MarketOutcomeAssetId | CombinatorialToken)[] | undefined => {
  if (!poolAssets || !marketOutcomeAssets || !parsedOutcomeAssets) return undefined;
  
  return poolAssets.filter(poolAsset => {
    if (isCombinatorialToken(poolAsset)) {
      // Check if this combo token appears in the market's outcome assets
      return marketOutcomeAssets.some(marketAssetString => 
        marketAssetString.includes(poolAsset.CombinatorialToken)
      );
    } else {
      // For regular assets, check if they match any of the parsed outcome assets
      return parsedOutcomeAssets.some(outcomeAsset => 
        JSON.stringify(outcomeAsset) === JSON.stringify(poolAsset)
      );
    }
  });
}; 