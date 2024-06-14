import {
  MarketWhereInput,
  HistoricalSwapWhereInput,
} from "@zeitgeistpm/indexer";
import { supportedCurrenciesFilter } from "../../constants/supported-currencies";

export const marketMetaFilter: MarketWhereInput = {
  question_isNull: false,
  question_not_eq: "",
  categories_isNull: false,
  hasValidMetaCategories_eq: true,
  baseAsset_in: supportedCurrenciesFilter,
};

export const swapsMetaFilter: HistoricalSwapWhereInput = {
  assetIn_in: supportedCurrenciesFilter,
};
