import { isWSX, wsxID } from "lib/constants";

export const marketMetaFilter = isWSX
  ? `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, scoringRule_not_eq: Parimutuel, baseAsset_eq: "{\\"campaignAsset\\":${wsxID}}"`
  : `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, scoringRule_not_eq: Parimutuel, baseAsset_not_eq: "{\\"campaignAsset\\":${wsxID}}"`;
