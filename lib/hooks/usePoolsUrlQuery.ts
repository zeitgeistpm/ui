import {
  PaginationOptions,
  FilterOptions,
  SortOptions,
  PoolsListQuery,
} from "lib/types";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { useCallback, useMemo } from "react";
import { merge, last } from "lodash";
import { DeepPartial } from "lib/types/DeepPartial";

export type PoolsListQueryUpdater = (
  update: DeepPartial<PoolsListQuery>
) => void;

export const usePoolsListQuery = (): PoolsListQuery & {
  updateQuery: PoolsListQueryUpdater;
} => {
  const router = useRouter();
  const rawQuery = router.query;

  const query = useMemo(() => parse(rawQuery), [rawQuery]);

  const updateQuery = useCallback<PoolsListQueryUpdater>(
    (update) => {
      const newQuery: PoolsListQuery = merge(query, update);
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

export const defaultQueryState: PoolsListQuery = {
  pagination: {
    page: 1,
    pageSize: 14,
  },
};

const paginationKeys = Object.keys(defaultQueryState.pagination);

const toString = (query: PoolsListQuery) => {
  return [...Object.entries(query.pagination)]
    .map(([key, value]) =>
      typeof value !== "undefined" ? `${key}=${value}` : null
    )
    .filter((queryString) => queryString !== null)
    .join("&");
};

const parse = (rawQuery: ParsedUrlQuery): PoolsListQuery => {
  let pagination: PaginationOptions = {
    ...defaultQueryState.pagination,
  };
  for (const paginationKey of paginationKeys) {
    if (rawQuery[paginationKey]) {
      pagination[paginationKey] = JSON.parse(rawQuery[paginationKey] as string);
    }
  }

  return {
    pagination,
  };
};
