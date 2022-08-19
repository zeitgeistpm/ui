import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { X } from "react-feather";
import { useRouter } from "next/router";
import hashObject from "object-hash";
import { useStore } from "lib/stores/Store";
import Card from "./MarketCard";
import MainFilters from "./filters/MainFilters";
import MyFilters from "./filters/MyFilters";
import MarketSkeletons from "./MarketSkeletons";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";
import { usePrevious } from "lib/hooks/usePrevious";
import { useDebounce } from "use-debounce";
import Loader from "react-spinners/PulseLoader";
import { useIsOnScreen } from "lib/hooks/useIsOnScreen";
import { useContentScrollTop } from "components/context/ContentDimensionsContext";
import { debounce } from "lodash";
import { makeAutoObservable } from "mobx";
import { useUserStore } from "lib/stores/UserStore";

export type MarketsListProps = {
  className?: string;
};

const scrollRestoration = makeAutoObservable({
  scrollTop: 0,
  set(scrollTop: number) {
    this.scrollTop = scrollTop;
  },
});

const MarketsFilters = observer(
  ({ onFilterClick }: { onFilterClick: () => void }) => {
    const query = useMarketsUrlQuery();

    const userStore = useUserStore();

    if (userStore.graphQlEnabled === false) {
      return null;
    }

    return (
      <>
        {query.searchText && (
          <MarketsSearchInfo searchText={query.searchText} />
        )}

        {query.tag && <MarketsSearchInfo searchText={query.tag} />}

        {!query.myMarketsOnly && (
          <MainFilters
            filters={query.filter}
            sortOptions={query.sorting}
            onFiltersChange={(filter) => {
              onFilterClick();
              query.updateQuery({ filter, pagination: { page: 1 } });
            }}
            onSortOptionChange={(sorting) => {
              query.updateQuery({ sorting });
            }}
          />
        )}

        {query.myMarketsOnly && (
          <MyFilters
            filters={query.filter}
            onFiltersChange={(filter) => {
              onFilterClick();
              query.updateQuery({
                filter,
                pagination: { page: 1 },
              });
            }}
            onSortOptionChange={(sorting) => {
              query.updateQuery({ sorting });
            }}
          />
        )}
      </>
    );
  },
);

const MarketsList = observer(({ className = "" }: MarketsListProps) => {
  const store = useStore();
  const [initialLoad, setInitialLoad] = useState(true);

  const query = useMarketsUrlQuery();
  const [debouncedQueryChange] = useDebounce(hashObject(query), 250);

  const [totalPages, setTotalPages] = useState<number>(0);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [pageLoaded, setPageLoaded] = useState<boolean | null>(null);

  const [scrollTop, scrollTo] = useContentScrollTop();

  const prevPage = usePrevious(query.pagination.page);

  const paginatorRef = useRef<HTMLDivElement>();
  const listRef = useRef<HTMLDivElement>();

  const count = store.markets.count;
  const hasNext = query.pagination.page < totalPages;

  const markets = store.markets.order.map((id) => {
    return store.markets.markets[id];
  });

  const performQuery = () => {
    return store.markets.fetchMarkets(query);
  };

  const hasScrolledToEnd = useIsOnScreen(paginatorRef);

  useEffect(
    debounce(() => {
      scrollRestoration.set(scrollTop);
    }, 150),
    [scrollTop],
  );

  useLayoutEffect(() => {
    if (initialLoad && scrollRestoration.scrollTop) {
      scrollTo(scrollRestoration.scrollTop);
    }
  }, [initialLoad, scrollRestoration.scrollTop]);

  useEffect(() => {
    if (pageLoaded !== true) {
      return;
    }
    if (hasNext && hasScrolledToEnd) {
      query.updateQuery({
        pagination: { page: query.pagination.page + 1 },
      });
    }
  }, [hasScrolledToEnd, hasNext]);

  useEffect(() => {
    setPageLoaded(false);
    performQuery().then(() => {
      setLoadingNextPage(false);
      setPageLoaded(true);
      setInitialLoad(false);
    });
  }, [debouncedQueryChange]);

  useEffect(() => {
    if (query.pagination.page > prevPage) {
      setLoadingNextPage(true);
    }
  }, [query.pagination.page, prevPage]);

  useEffect(() => {
    setTotalPages(Math.ceil(count / query.pagination.pageSize));
  }, [count]);

  return (
    <div className={"pt-ztg-46 " + className} ref={listRef}>
      <h3 className="mb-ztg-40 font-space text-[24px] font-semibold">
        <span className="mr-4">
          {query.myMarketsOnly ? "My Markets" : "All Markets"}
        </span>
        {loadingNextPage || (!pageLoaded && <Loader size={8} />)}
      </h3>
      <div id="marketsList">
        <MarketsFilters
          onFilterClick={() => {
            setPageLoaded(false);
          }}
        />
      </div>
      <div className="mb-ztg-38">
        {markets?.length > 0 &&
          markets.map((market) => (
            <Card marketStore={market} key={market.id} />
          ))}

        {loadingNextPage && (
          <MarketSkeletons pageSize={query.pagination.pageSize} />
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
