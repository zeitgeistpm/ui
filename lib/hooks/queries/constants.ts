import {
  MarketWhereInput,
  HistoricalSwapWhereInput,
} from "@zeitgeistpm/indexer";
import { isWSX, wsxAssetIdString, wsxID } from "lib/constants";

export const marketMetaFilter: MarketWhereInput = {
  question_isNull: false,
  question_not_eq: "",
  categories_isNull: false,
  hasValidMetaCategories_eq: true,
  // ...(isWSX ? { baseAsset_eq: wsxAssetIdString } : {}),
  // ...(!isWSX ? { baseAsset_not_eq: wsxAssetIdString } : {}),
};

export const swapsMetaFilter: HistoricalSwapWhereInput = {
  ...(isWSX
    ? {
        assetIn_eq: wsxAssetIdString,
        assetOut_eq: wsxAssetIdString,
      }
    : {
        assetIn_not_eq: wsxAssetIdString,
        assetOut_not_eq: wsxAssetIdString,
      }),
};
