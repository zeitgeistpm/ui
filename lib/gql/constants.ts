import { isCampaignAsset, campaignID } from "lib/constants";

export const marketMetaFilter = isCampaignAsset
  ? `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, scoringRule_not_eq: Parimutuel, baseAsset_eq: "{\\"foreignAsset\\":${campaignID}}"`
  : `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, scoringRule_not_eq: Parimutuel, baseAsset_not_eq: "{\\"foreignAsset\\":${campaignID}}"`;
