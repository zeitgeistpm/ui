import {
  MarketWhereInput,
  HistoricalSwapWhereInput,
} from "@zeitgeistpm/indexer";
import { isNTT, nttAssetIdString, nttID } from "lib/constants";

export const marketMetaFilter: MarketWhereInput = {
  question_isNull: false,
  question_not_eq: "",
  categories_isNull: false,
  hasValidMetaCategories_eq: true,
  ...(isNTT ? { baseAsset_eq: nttAssetIdString } : {}),
  ...(!isNTT ? { baseAsset_not_eq: nttAssetIdString } : {}),
};

export const swapsMetaFilter: HistoricalSwapWhereInput = {
  ...(isNTT
    ? {
        assetIn_eq: nttAssetIdString,
        assetOut_eq: nttAssetIdString,
      }
    : {
        assetIn_not_eq: nttAssetIdString,
        assetOut_not_eq: nttAssetIdString,
      }),
};
