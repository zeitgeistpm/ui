import { AssetId, parseAssetId } from "@zeitgeistpm/sdk";

export const parseAssetIdString = (
  assetId?: string | AssetId,
): AssetId | undefined => {
  return assetId ? parseAssetId(assetId).unrightOr(undefined) : undefined;
};
