import { MarketFilter } from "lib/types/market-filter";

/**
 * Return true if `a` and `b` filters are same, else return false
 */
export const compareMarketFilters = (
  a: MarketFilter,
  b: MarketFilter,
): boolean => {
  return a.value === b.value && a.type === b.type;
};

/**
 * Returns the index of the `searchItem` in the array and -1 otherwise.
 */
export const findFilterIndex = (
  filters: MarketFilter[],
  searchItem: MarketFilter,
) => {
  return filters.findIndex((item) => {
    return compareMarketFilters(searchItem, item);
  });
};
