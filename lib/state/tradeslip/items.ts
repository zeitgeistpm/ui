import { CategoricalAssetId, ScalarAssetId } from "@zeitgeistpm/sdk-next";

/**
 * An item in the tradeslip list.
 */
export type TradeSlipItem = {
  action: "buy" | "sell";
  assetId: CategoricalAssetId | ScalarAssetId;
  amount: number;
};
