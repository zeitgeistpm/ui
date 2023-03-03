import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isUndefined, isEmpty } from "lodash";
import { DeepPartial } from "lib/types/DeepPartial";
import { parse as parseUri } from "uri-js";
import { MarketsListQuery, MarketsOrderBy } from "lib/types/market-filter";
import { defaultMarketsQueryState } from "lib/constants/market-filter";
import { filterTypes } from "lib/constants/market-filter";

export type MarketListQueryUpdater = (
  update: DeepPartial<MarketsListQuery>,
) => void;

const getQueryParams = (path: string) => {
  const url = parseUri(path);
  let queryParams = {};
  const queryParamsArr = [...Array.from(new URLSearchParams(url.query))];
  for (const pair of queryParamsArr) {
    queryParams[pair[0]] = pair[1];
  }
  return queryParams;
};

const useMarketsUrlQuery = (): MarketsListQuery & {
  updateQuery: MarketListQueryUpdater;
} => {
  const router = useRouter();
  const routerPath = router.asPath;
  const [query, setQuery] = useState<MarketsListQuery>();

  const setQueryToDefault = () => {
    setQuery(defaultMarketsQueryState);
    updateQuery(defaultMarketsQueryState);
  };

  const setInitialQuery = useCallback(() => {
    const queryParams = getQueryParams(routerPath);
    try {
      if (isEmpty(queryParams)) {
        setQueryToDefault();
      } else {
        const query = parse(queryParams);
        setQuery(query);
      }
    } catch (error) {
      console.warn(error);
      setQueryToDefault();
    }
  }, [routerPath]);

  useEffect(() => {
    const queryParams = getQueryParams(routerPath);
    const query = parse(queryParams);
    setQuery(query);
  }, [routerPath]);

  useEffect(() => {
    setInitialQuery();
  }, []);

  const updateQuery = useCallback<MarketListQueryUpdater>(
    (update) => {
      const filters = update.filters ?? query.filters;
      const ordering = update.ordering ?? query.ordering;
      const liquidityOnly = update.liquidityOnly ?? query.liquidityOnly;
      const newQuery = { filters, ordering, liquidityOnly };
      router.replace(
        {
          query: toString(newQuery),
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [routerPath, query],
  );

  const [queryState, setQueryState] = useState<
    MarketsListQuery & { updateQuery: MarketListQueryUpdater }
  >();

  useEffect(() => {
    if (query == null) {
      return;
    }
    setQueryState({ ...query, updateQuery });
  }, [query]);

  return queryState;
};

const toString = (query: MarketsListQuery) => {
  const { filters, ordering, liquidityOnly } = query;

  const filtersEntries = filterTypes.map((type) => [
    type,
    encodeURIComponent(filters[type].join(",")),
  ]);

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

  return [filtersQueryStr, orderingQueryStr, liquidityOnlyQueryStr].join("&");
};

const parse = (rawQuery: ParsedUrlQuery): MarketsListQuery => {
  const filters = {
    status: [],
    tag: [],
    currency: [],
  };

  const ordering: MarketsOrderBy = rawQuery["ordering"] as MarketsOrderBy;
  const liquidityOnly = rawQuery["liquidityOnly"] === "true";

  for (const filterType of filterTypes) {
    if (rawQuery[filterType]) {
      const val: string = rawQuery[filterType] as string;
      const parsedVal = val.split(",");
      filters[filterType] = parsedVal;
    }
  }

  return {
    filters,
    ordering: ordering ?? MarketsOrderBy.Newest,
    liquidityOnly,
  };
};

export default useMarketsUrlQuery;
