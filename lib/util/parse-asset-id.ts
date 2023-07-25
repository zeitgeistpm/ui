import { AssetId, parseAssetId } from "@zeitgeistpm/sdk-next";

export const parseAssetIdString = (assetId?: string): AssetId | undefined => {
  return assetId ? parseAssetId(assetId).unrightOr(undefined) : undefined;
};
