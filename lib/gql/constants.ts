import { isWSX } from "lib/constants";

export const marketMetaFilter = isWSX
  ? `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, baseAsset_eq: "{\\"foreignAsset\\":3}"`
  : `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, baseAsset_not_eq: "{\\"foreignAsset\\":3}"`;
