import { AssetId, parseAssetId } from "@zeitgeistpm/sdk";

export const parseAssetIdString = (assetId?: string): AssetId | undefined => {
  return assetId ? parseAssetId(assetId).unrightOr(undefined) : undefined;
};
