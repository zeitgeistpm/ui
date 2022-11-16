import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { X } from "react-feather";
import { useRouter } from "next/router";
import hashObject from "object-hash";
import { useStore } from "lib/stores/Store";
import MarketCard from "./market-card";
import MainFilters from "./filters/MainFilters";
import MyFilters from "./filters/MyFilters";
import MarketSkeletons from "./MarketSkeletons";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";
import { usePrevious } from "lib/hooks/usePrevious";
import Loader from "react-spinners/PulseLoader";
import { useIsOnScreen } from "lib/hooks/useIsOnScreen";
import { useContentScrollTop } from "components/context/ContentDimensionsContext";
import { debounce, isEmpty } from "lodash";
import { makeAutoObservable } from "mobx";
import { MarketCardData } from "lib/gql/markets-list/types";

export type MarketsListProps = {
  className?: string;
};

const scrollRestoration = makeAutoObservable({
  scrollTop: 0,
  set(scrollTop: number) {
    this.scrollTop = scrollTop;
  },
});

const MarketsList = observer(({ className = "" }: MarketsListProps) => {
  const store = useStore();
  const { markets: marketsStore, preloadedMarkets } = store;
  const [initialLoad, setInitialLoad] = useState(true);

  const query = useMarketsUrlQuery();
  const [queryState, setQueryState] = useState(query);
  const [hashedQuery, setHashedQuery] = useState<string>();

  const [totalPages, setTotalPages] = useState<number>(0);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [pageLoaded, setPageLoaded] = useState<boolean | null>(null);

  const [scrollTop, scrollTo] = useContentScrollTop();

  const [isMyMarkets, setIsMyMarkets] = useState<boolean>();

  const prevPage = usePrevious(queryState?.pagination?.page);

  const paginatorRef = useRef<HTMLDivElement>();
  const listRef = useRef<HTMLDivElement>();

  const count = marketsStore?.count;
  const hasNext = query?.pagination?.page < totalPages;

  const performQuery = () => {
    return marketsStore.fetchMarkets(query);
  };

  const hasScrolledToEnd = useIsOnScreen(paginatorRef);

  useEffect(
    debounce(() => {
      scrollRestoration.set(scrollTop);
    }, 150),
    [scrollTop],
  );

  useEffect(() => {
    setHashedQuery(hashObject(query));
    if (query.myMarketsOnly === true) {
      setIsMyMarkets(true);
    } else {
      setIsMyMarkets(false);
    }
  }, [query]);

  const [marketsList, setMarketsList] = useState<MarketCardData[]>();

  useEffect(() => {
    if (marketsStore.initialPageLoaded !== true) {
      setMarketsList(preloadedMarkets);
    }
  }, [marketsStore.initialPageLoaded, marketsStore.order, preloadedMarkets]);

  useEffect(() => {
    if (initialLoad && scrollRestoration.scrollTop) {
      scrollTo(scrollRestoration.scrollTop);
    }
  }, [initialLoad, scrollRestoration.scrollTop]);

  useEffect(() => {
    if (pageLoaded !== true || !marketsStore.initialPageLoaded) {
      return;
    }
    if (hasNext && hasScrolledToEnd) {
      query.updateQuery({
        pagination: { page: query?.pagination?.page + 1 },
      });
      setQueryState(query);
    }
  }, [hasScrolledToEnd, marketsStore.initialPageLoaded, hasNext]);

  useEffect(() => {
    if (store.sdk == null) {
      return;
    }
    if (isMyMarkets && store.wallets.activeAccount == null) {
      return;
    }
    setPageLoaded(false);
    performQuery().then(() => {
      setLoadingNextPage(false);
      setPageLoaded(true);
      setInitialLoad(false);
      if (marketsStore.initialPageLoaded === false) {
        marketsStore.setInitialPageLoaded();
      }
    });
  }, [hashedQuery, store.sdk, store.wallets.activeAccount]);

  useEffect(() => {
    if (queryState?.pagination?.page > prevPage) {
      setLoadingNextPage(true);
    }
  }, [queryState?.pagination?.page]);

  useEffect(() => {
    if (count) {
      setTotalPages(Math.ceil(count / query.pagination.pageSize));
    }
  }, [count]);

  return (
    <div className={"pt-ztg-46 " + className} ref={listRef}>
      <h3 className="mb-ztg-40 font-space text-[24px] font-semibold">
        <span className="mr-4">
          {isMyMarkets ? "My Markets" : "All Markets"}
        </span>
        {loadingNextPage || (!pageLoaded && <Loader size={8} />)}
      </h3>
      {/* TODO: Filters here */}
      <div></div>
      <div className="mb-ztg-38 grid grid-cols-3 gap-[30px]">
        {query != null &&
          marketsList?.map((market) => {
            return (
              <MarketCard
                marketId={market.id}
                categories={market.categories}
                question={market.question}
                status={market.status}
                // prediction={prediction}
                volume={100}
                key={`market-${market.id}`}
              />
            );
          })}

        {(marketsList == null || loadingNextPage) && (
          <MarketSkeletons pageSize={queryState?.pagination?.pageSize ?? 5} />
        )}

        {pageLoaded && count === 0 && (
          <div className="text-center">No results!</div>
        )}

        <div className="my-22 w-full h-40"></div>

        <div ref={paginatorRef} />
      </div>
    </div>
  );
});

const MarketsSearchInfo = observer(({ searchText }: { searchText: string }) => {
  const router = useRouter();

  return (
    <div className="flex my-ztg-30 h-ztg-34">
      <h6 className="font-space  text-ztg-[24px]" id="marketsHead">
        {`Search results for: "${searchText}"`}
      </h6>
      <div className="w-ztg-24 h-ztg-24 rounded-full bg-sky-400 dark:bg-black center ml-ztg-15">
        <X
          size={24}
          className="cursor-pointer text-sky-600"
          onClick={() => {
            router.push("/", null, { shallow: true });
          }}
        />
      </div>
    </div>
  );
});

export default MarketsList;
