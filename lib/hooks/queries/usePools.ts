import { useInfiniteQuery } from "@tanstack/react-query";
import { sortBy } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { usePoolsListQuery } from "../usePoolsUrlQuery";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pools";

export const usePools = () => {
  const [sdk, id] = useSdkv2();

  const urlquery = usePoolsListQuery();
  const initialPage = useMemo(() => urlquery.page, []);
  const initialLoad = useRef(true);

  const limit = 10;

  const fetcher = async () => {
    let params = initialLoad.current
      ? {
          offset: 0,
          limit: limit * urlquery.page,
        }
      : {
          offset: urlquery.page * limit,
          limit: limit,
        };

    const pools = await sdk.model.swaps.listPools(params);
    console.log(pools);
    initialLoad.current = false;

    return {
      data: pools,
      hasNext: pools.length >= limit,
    };
  };

  const query = useInfiniteQuery({
    queryKey: [id, rootKey],
    queryFn: fetcher,
    enabled: Boolean(sdk),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? urlquery.page : null),
  });

  useEffect(() => {
    if (initialPage !== urlquery.page && query.hasNextPage) {
      query.fetchNextPage();
    }
  }, [urlquery?.page, initialPage]);

  return query;
};
