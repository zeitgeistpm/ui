import {
  MarketWhereInput,
  HistoricalSwapWhereInput,
} from "@zeitgeistpm/indexer";
import {
  isCampaignAsset,
  campaignAssetIdString,
  campaignID,
} from "lib/constants";

export const marketMetaFilter: MarketWhereInput = {
  question_isNull: false,
  question_not_eq: "",
  categories_isNull: false,
  hasValidMetaCategories_eq: true,
  ...(isCampaignAsset ? { baseAsset_eq: campaignAssetIdString } : {}),
  ...(!isCampaignAsset ? { baseAsset_not_eq: campaignAssetIdString } : {}),
};

export const swapsMetaFilter: HistoricalSwapWhereInput = {
  ...(isCampaignAsset
    ? {
        assetIn_eq: campaignAssetIdString,
        assetOut_eq: campaignAssetIdString,
      }
    : {
        assetIn_not_eq: campaignAssetIdString,
        assetOut_not_eq: campaignAssetIdString,
      }),
};
