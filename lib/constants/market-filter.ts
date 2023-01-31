import {
  MarketCurrencyFilter,
  MarketOrderByOption,
  MarketsListQuery,
  MarketsOrderBy,
  MarketStatusFilter,
  MarketTagFilter,
} from "lib/types/market-filter";
import { defaultTags, marketStatuses } from "./markets";

export const filterTypes = ["status", "tag", "currency"] as const;

export const marketStatusFilterOptions: MarketStatusFilter[] =
  marketStatuses.map((status) => ({
    type: "status",
    value: status,
    label: status,
  }));

export const marketTagFilterOptions: MarketTagFilter[] = defaultTags.map(
  (tag) => ({
    type: "tag",
    value: tag,
    label: tag,
  }),
);

export const marketCurrencyFilterOptions: MarketCurrencyFilter[] = [
  {
    type: "currency",
    value: "Ztg",
    label: "ZTG",
  },
];

export const defaultMarketFilters = [
  ...marketStatusFilterOptions.filter((f) => f.value === "Active"),
];

export const defaultMarketsQueryState: MarketsListQuery = {
  filters: {
    status: ["Active"],
    tag: [],
    currency: [],
  },
  ordering: MarketsOrderBy.Newest,
  liquidityOnly: true,
};

export const marketsOrderByOptions: MarketOrderByOption[] = Object.values(
  MarketsOrderBy,
).map((value) => {
  return { value, label: value };
});
