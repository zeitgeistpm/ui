import { useInfiniteQuery } from "@tanstack/react-query";
import { sortBy, uniqBy } from "lodash";
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

  const fetcher = async ({ pageParam = urlquery.page }) => {
    const params = initialLoad.current
      ? {
          offset: 0,
          limit: !pageParam ? limit : limit * pageParam,
        }
      : {
          offset: pageParam * limit,
          limit: limit,
        };

    const pools = await sdk.model.swaps.listPools(params);

    return {
      data: pools,
      next: pools.length >= limit ? pageParam + 1 : null,
    };
  };

  const query = useInfiniteQuery({
    queryKey: [id, rootKey],
    queryFn: fetcher,
    enabled: Boolean(sdk),
    getNextPageParam: (lastPage) => lastPage.next,
  });

  useEffect(() => {
    if (urlquery.page > initialPage && query.hasNextPage) {
      query.fetchNextPage();
    }
  }, [urlquery?.page, initialPage]);

  return query;
};
