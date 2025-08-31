import { AssetId, parseAssetId, MarketOutcomeAssetId } from "@zeitgeistpm/sdk";
import { CombinatorialToken, isCombinatorialToken } from "lib/types/combinatorial";

export const parseAssetIdString = (
  assetId?: string | AssetId,
): AssetId | undefined => {
  return assetId ? parseAssetId(assetId).unrightOr(undefined) : undefined;
};

/**
 * Parse an asset ID string that could be either a regular asset ID or a combinatorial token
 * @param assetIdString - The asset ID string to parse
 * @returns MarketOutcomeAssetId or CombinatorialToken
 */
export const parseAssetIdStringWithCombinatorial = (
  assetIdString: string | AssetId,
): MarketOutcomeAssetId | CombinatorialToken => {
  // First check if it's a combinatorial token
  // console.log("assetIdString", assetIdString);
  if (typeof assetIdString === 'string') {
    try {
      const parsed = JSON.parse(assetIdString);
      
      // Check if it has the lowercase 'combinatorialToken' field
      if (parsed.combinatorialToken) {
        const hexValue = parsed.combinatorialToken;
        const formattedHex = hexValue.startsWith('0x') ? hexValue : `0x${hexValue}`;
        
        return {
          CombinatorialToken: formattedHex as `0x${string}`
        };
      }
      
      // Check if it's already in the correct format
      if (isCombinatorialToken(parsed)) {
        return parsed;
      }
    } catch {
      // console.log("not valid json")
      // Not valid JSON, continue to regular parsing
    }
  } else if (isCombinatorialToken(assetIdString)) {
    return assetIdString as CombinatorialToken;
  }
  
  // Fall back to regular asset ID parsing
  return parseAssetIdString(assetIdString) as MarketOutcomeAssetId;
};
