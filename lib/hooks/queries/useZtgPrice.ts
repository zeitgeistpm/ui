import { UseQueryResult } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useAssetUsdPrice } from "./useAssetUsdPrice";

export const useZtgPrice = (): UseQueryResult<Decimal> => {
  return useAssetUsdPrice({ Ztg: null });
};
