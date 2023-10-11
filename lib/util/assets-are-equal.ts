import { AssetId } from "@zeitgeistpm/sdk";

export const assetsAreEqual = (asset1?: AssetId, asset2?: AssetId) => {
  return JSON.stringify(asset1) === JSON.stringify(asset2);
};
