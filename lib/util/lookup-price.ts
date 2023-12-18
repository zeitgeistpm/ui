import { IOForeignAssetId, parseAssetId } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { ForeignAssetPrices } from "lib/hooks/queries/useAssetUsdPrice";

export const lookUpAssetPrice = (
  baseAsset: string,
  foreignAssetPrices: ForeignAssetPrices,
  ztgPrice: Decimal,
) => {
  const assetId = parseAssetId(baseAsset).unwrap();

  return IOForeignAssetId.is(assetId)
    ? foreignAssetPrices[assetId.ForeignAsset.toString()]
    : ztgPrice;
};
