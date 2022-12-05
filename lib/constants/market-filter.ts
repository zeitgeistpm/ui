import {
  MarketCurrencyFilter,
  MarketStatusFilter,
  MarketTagFilter,
} from "lib/types/market-filter";
import { defaultTags, marketStatuses } from "./markets";

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
    label: "Ztg",
  },
];
