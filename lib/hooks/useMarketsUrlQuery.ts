import {
  PaginationOptions,
  FilterOptions,
  SortOptions,
  MarketListQuery,
} from "lib/types";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { useCallback, useMemo } from "react";
import { merge, last } from "lodash";
import { DeepPartial } from "lib/types/DeepPartial";

export type MarketListQueryUpdater = (
  update: DeepPartial<MarketListQuery>
) => void;

export const useMarketsUrlQuery = (): MarketListQuery & {
  updateQuery: MarketListQueryUpdater;
} => {
  const router = useRouter();
  const rawQuery = router.query;

  const query = useMemo(() => parse(rawQuery), [rawQuery]);

  const updateQuery = useCallback<MarketListQueryUpdater>(
    (update) => {
      const newQuery: MarketListQuery = merge(query, update);
      router.replace({
        query: toString(newQuery),
      });
    },
    [rawQuery]
  );

  return {
    ...query,
    updateQuery,
  };
};

export const defaultQueryState: MarketListQuery = {
  pagination: {
    page: 1,
    pageSize: 5,
  },
  filter: {
    Proposed: false,
    Active: true,
    Ended: false,
    Reported: false,
    Disputed: false,
    Resolved: false,
    HasLiquidityPool: true,
    oracle: false,
    creator: true,
    hasAssets: false,
  },
  sorting: {
    order: "asc",
    sortBy: "CreatedAt",
  },
};

const paginationKeys = Object.keys(defaultQueryState.pagination);
const filterKeys = Object.keys(defaultQueryState.filter);
const sortKeys = Object.keys(defaultQueryState.sorting);

const toString = (query: MarketListQuery) => {
  return [
    ...Object.entries(query.pagination),
    ...Object.entries(query.filter),
    ...Object.entries(query.sorting),
    ["tag", query.tag],
    ["myMarketsOnly", query.myMarketsOnly],
    ["searchText", query.searchText],
  ]
    .map(([key, value]) =>
      typeof value !== "undefined" ? `${key}=${value}` : null
    )
    .filter((queryString) => queryString !== null)
    .join("&");
};

const parse = (rawQuery: ParsedUrlQuery): MarketListQuery => {
  let pagination: PaginationOptions = {
    ...defaultQueryState.pagination,
  };
  let filter: FilterOptions = { ...defaultQueryState.filter };
  let sorting: SortOptions = { ...defaultQueryState.sorting };
  for (const paginationKey of paginationKeys) {
    if (rawQuery[paginationKey]) {
      pagination[paginationKey] = JSON.parse(rawQuery[paginationKey] as string);
    }
  }
  for (const filterKey of filterKeys) {
    if (rawQuery[filterKey]) {
      filter[filterKey] = JSON.parse(rawQuery[filterKey] as string);
    }
  }
  for (const sortKey of sortKeys) {
    if (rawQuery[sortKey]) {
      sorting[sortKey] = rawQuery[sortKey];
    }
  }

  const tag = Array.isArray(rawQuery.tag) ? last(rawQuery.tag) : rawQuery.tag;

  const searchText = Array.isArray(rawQuery.searchText)
    ? last(rawQuery.searchText)
    : rawQuery.searchText;

  const myMarketsOnly: boolean | undefined = !rawQuery.myMarketsOnly
    ? undefined
    : Array.isArray(rawQuery.myMarketsOnly)
    ? JSON.parse(last(rawQuery.myMarketsOnly))
    : JSON.parse(rawQuery.myMarketsOnly);

  return {
    pagination,
    filter,
    sorting,
    tag,
    searchText,
    myMarketsOnly,
  };
};
