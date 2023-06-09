import { parseAssetId } from "@zeitgeistpm/sdk-next";

export const parseAssetIdString = (assetId?: string) => {
  return assetId ? parseAssetId(assetId).unrightOr(undefined) : undefined;
};
