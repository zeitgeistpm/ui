import { IOForeignAssetId, parseAssetId } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { ForeignAssetPrices } from "lib/hooks/queries/useAssetUsdPrice";

export const lookUpAssetPrice = (
  baseAsset: string,
  foreignAssetPrices: ForeignAssetPrices,
  ztgPrice: Decimal,
) => {
  const assetId = parseAssetId(baseAsset).unwrap();

  return IOForeignAssetId.is(assetId)
    ? foreignAssetPrices[assetId.ForeignAsset.toString()]?.div(ztgPrice)
    : ztgPrice;
};
