import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";

export const extractSwapWeights = (
  pool: Swap,
  assetId: AssetId,
  baseAsset: string
) => {
  const assetString = JSON.stringify(assetId);

  const assetWeight = new Decimal(pool.weights.value.toJSON()[assetString]);
  const baseWeight = new Decimal(pool.weights.value.toJSON()[baseAsset]);

  return { assetWeight, baseWeight };
};
