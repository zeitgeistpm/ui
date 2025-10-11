import {
  defaultMarketsQueryState,
  filterTypes,
} from "lib/constants/market-filter";
import { isPresent } from "lib/types";
import { DeepPartial } from "lib/types/deep-partial";
import { MarketsListQuery, MarketsOrderBy } from "lib/types/market-filter";
import { getQueryParams } from "lib/util/get-query-params";
import { isEmpty, isUndefined } from "lodash";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { useCallback } from "react";

export type MarketListQueryUpdater = (
  update: DeepPartial<MarketsListQuery>,
) => void;

const parseQuery = (queryParams: {}) => {
  try {
    if (isEmpty(queryParams)) {
      return defaultMarketsQueryState;
    } else {
      return parse(queryParams);
    }
  } catch (error) {
    console.warn(error);
    return defaultMarketsQueryState;
  }
};

const useMarketsUrlQuery = (): MarketsListQuery & {
  updateQuery: MarketListQueryUpdater;
} => {
  const router = useRouter();
  const routerPath = router.asPath;
  const queryParams = getQueryParams(routerPath);
  const query = parseQuery(queryParams);

  const updateQuery = useCallback<MarketListQueryUpdater>(
    (update) => {
      // Get the current query from the URL at the time of calling
      const currentQueryParams = getQueryParams(router.asPath);
      const currentQuery = parseQuery(currentQueryParams);

      const filters = update.filters ?? currentQuery.filters;
      const ordering = update.ordering ?? currentQuery.ordering;
      const liquidityOnly = update.liquidityOnly ?? currentQuery.liquidityOnly;
      const marketType = update.marketType ?? currentQuery.marketType;
      const newQuery = { filters, ordering, liquidityOnly, marketType };
      router.replace(
        {
          query: toString(newQuery),
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router], // Only depend on router, not on query
  );

  return { ...query, updateQuery };
};

const toString = (query: DeepPartial<MarketsListQuery>) => {
  const { filters, ordering, liquidityOnly, marketType } = query;

  const filtersEntries = filterTypes
    .map((type) => {
      const f = filters?.[type];
      if (!isPresent(f)) {
        return;
      }
      return [type, encodeURIComponent(f.join(","))];
    })
    .filter(isPresent);

  const filtersQueryStr = filtersEntries
    .map(([key, value]) => {
      if (value) {
        return `${key}=${value}`;
      }
    })
    .filter((qs) => !isUndefined(qs))
    .join("&");

  const orderingQueryStr = `ordering=${ordering}`;

  const liquidityOnlyQueryStr = `liquidityOnly=${liquidityOnly}`;

  const marketTypeQueryStr = `marketType=${marketType}`;

  return [
    filtersQueryStr,
    orderingQueryStr,
    liquidityOnlyQueryStr,
    marketTypeQueryStr,
  ].join("&");
};

const parse = (rawQuery: ParsedUrlQuery): MarketsListQuery => {
  const filters: { status: string[]; tag: string[]; currency: string[] } = {
    status: [],
    tag: [],
    currency: [],
  };

  const ordering: MarketsOrderBy = rawQuery["ordering"] as MarketsOrderBy;
  const liquidityOnly = rawQuery["liquidityOnly"] === "true";
  const marketType =
    (rawQuery["marketType"] as "regular" | "multi") ?? "regular";

  for (const filterType of filterTypes) {
    if (rawQuery[filterType] && filters) {
      const val: string = rawQuery[filterType] as string;
      const parsedVal = val.split(",");
      filters[filterType] = parsedVal;
    }
  }

  return {
    filters,
    ordering: ordering ?? MarketsOrderBy.Newest,
    liquidityOnly,
    marketType,
  };
};

export default useMarketsUrlQuery;
