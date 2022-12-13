import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isUndefined, isEmpty } from "lodash";
import { DeepPartial } from "lib/types/DeepPartial";
import { parse as parseUri } from "uri-js";
import { MarketsListQuery } from "lib/types/market-filter";
import { defaultMarketsQueryState } from "lib/constants/market-filter";
import { filterTypes } from "lib/constants/market-filter";

export type MarketListQueryUpdater = (
  update: DeepPartial<MarketsListQuery>,
) => void;

const useMarketsUrlQuery = (): MarketsListQuery & {
  updateQuery: MarketListQueryUpdater;
} => {
  const router = useRouter();
  const routerPath = router.asPath;
  const [firstLoad, setFirstLoad] = useState(true);
  const [query, setQuery] = useState<MarketsListQuery>();

  useEffect(() => {
    try {
      const url = parseUri(routerPath);
      let queryParams = {};
      const queryParamsArr = [...Array.from(new URLSearchParams(url.query))];
      for (const pair of queryParamsArr) {
        queryParams[pair[0]] = pair[1];
      }
      if (firstLoad && isEmpty(queryParams)) {
        setQuery(defaultMarketsQueryState);
        updateQuery(defaultMarketsQueryState);
        setFirstLoad(false);
      } else {
        setQuery(parse(queryParams));
      }
    } catch (error) {
      console.warn(error);
      setQuery(defaultMarketsQueryState);
    }
  }, [routerPath]);

  const updateQuery = useCallback<MarketListQueryUpdater>(
    (update) => {
      const newFilters = { ...(query?.filters ?? []), ...update.filters };
      const newQuery = { filters: newFilters };
      router.replace({
        query: toString(newQuery),
      });
    },
    [routerPath],
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
  const { filters } = query;

  const filtersEntries = filterTypes.map((type) => [
    type,
    encodeURIComponent(filters[type].join(",")),
  ]);

  return filtersEntries
    .map(([key, value]) => {
      if (value) {
        return `${key}=${value}`;
      }
    })
    .filter((qs) => !isUndefined(qs))
    .join("&");
};

const parse = (rawQuery: ParsedUrlQuery): MarketsListQuery => {
  const filters = {
    status: [],
    tag: [],
    currency: [],
  };

  for (const filterType of filterTypes) {
    if (rawQuery[filterType]) {
      const val: string = rawQuery[filterType] as string;
      const parsedVal = val.split(",");
      filters[filterType] = parsedVal;
    }
  }

  return {
    filters,
  };
};

export default useMarketsUrlQuery;
