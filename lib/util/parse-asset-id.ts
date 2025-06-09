import { AssetId, parseAssetId } from "@zeitgeistpm/sdk";

export const parseAssetIdString = (
  assetId?: string | AssetId,
): AssetId | undefined => {
  // console.log(assetId ? parseAssetId(assetId).unrightOr(undefined) : undefined)
  return assetId ? parseAssetId(assetId).unrightOr(undefined) : undefined;
};
