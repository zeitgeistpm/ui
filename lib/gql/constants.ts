import { isNTT, nttID } from "lib/constants";

export const marketMetaFilter = isNTT
  ? `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, baseAsset_eq: "{\\"foreignAsset\\":${nttID}}"`
  : `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, baseAsset_not_eq: "{\\"foreignAsset\\":${nttID}}"`;
