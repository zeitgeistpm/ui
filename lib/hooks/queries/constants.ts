import { MarketWhereInput } from "@zeitgeistpm/indexer";
import { isWSX, wsxID } from "lib/constants";

export const marketMetaFilter: MarketWhereInput = {
  question_isNull: false,
  question_not_eq: "",
  categories_isNull: false,
  hasValidMetaCategories_eq: true,
  baseAsset_eq: isWSX ? `{"foreignAsset":${wsxID}}` : undefined,
  baseAsset_not_eq: !isWSX ? `{"foreignAsset":${wsxID}}` : undefined,
};
