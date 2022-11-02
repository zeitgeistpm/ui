import { PaginationOptions, PoolsListQuery } from "lib/types";
import { DeepPartial } from "lib/types/DeepPartial";
import { merge } from "lodash";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { useCallback, useMemo } from "react";

export type PoolsListQueryUpdater = (
  update: DeepPartial<PoolsListQuery>,
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
    [rawQuery],
  );

  return {
    ...query,
    updateQuery,
  };
};

export const defaultQueryState: PoolsListQuery = {
  page: 0,
};

const paginationKeys = Object.keys(defaultQueryState);

const toString = (query: PoolsListQuery) => {
  return [...Object.entries(query)]
    .map(([key, value]) =>
      typeof value !== "undefined" ? `${key}=${value}` : null,
    )
    .filter((queryString) => queryString !== null)
    .join("&");
};

const parse = (rawQuery: ParsedUrlQuery): PoolsListQuery => {
  return {
    page: JSON.parse((rawQuery["page"] ?? "0") as string),
  };
};
