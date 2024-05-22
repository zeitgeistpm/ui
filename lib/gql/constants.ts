import { supportedCurrenciesFilter } from "lib/constants/supported-currencies";

export const marketMetaFilter = `question_not_eq: "", question_isNull: false, categories_isNull: false, hasValidMetaCategories_eq: true, scoringRule_not_eq: Parimutuel, baseAsset_in: ${JSON.stringify(
  supportedCurrenciesFilter,
)}`;
