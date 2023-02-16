import { Context, IndexedMarket, ScalarRangeType } from "@zeitgeistpm/sdk-next";
import React, { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { useInView } from "react-intersection-observer";
import { observer } from "mobx-react";
import { makeAutoObservable } from "mobx";
import Loader from "react-spinners/PulseLoader";
import { X } from "react-feather";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import { useStore } from "lib/stores/Store";
import { useInfiniteMarkets } from "lib/hooks/queries/useInfiniteMarkets";
import { MarketOutcomes } from "lib/types/markets";
import { useContentScrollTop } from "components/context/ContentDimensionsContext";
import { useContentWidth } from "components/context/ContentDimensionsContext";
import { MarketFilter, MarketsOrderBy } from "lib/types/market-filter";
import MarketFilterSelection from "./market-filter";
import MarketCard from "./market-card/index";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";
import { filterTypes } from "lib/constants/market-filter";
import { ZTG } from "lib/constants";

export type MarketsListProps = {
  className?: string;
};

const scrollRestoration = makeAutoObservable({
  scrollTop: 0,
  set(scrollTop: number) {
    this.scrollTop = scrollTop;
  },
});

const useChangeQuery = (
  filters?: MarketFilter[],
  orderBy?: MarketsOrderBy,
  withLiquidityOnly?: boolean,
) => {
  const queryState = useMarketsUrlQuery();

  useEffect(() => {
    if (filters == null) {
      return;
    }
    const newFilters = {};
    for (const filterType of filterTypes) {
      const filterByType = filters.filter((f) => f.type === filterType);
      newFilters[filterType] = filterByType.map((f) => f.value);
    }
    queryState?.updateQuery({
      filters: newFilters,
    });
  }, [filters]);

  useEffect(() => {
    if (orderBy == null) {
      return;
    }
    queryState?.updateQuery({ ordering: orderBy });
  }, [orderBy]);

  useEffect(() => {
    if (withLiquidityOnly == null) {
      return;
    }
    queryState?.updateQuery({ liquidityOnly: withLiquidityOnly });
  }, [withLiquidityOnly]);
};

const MarketsList = observer(({ className = "" }: MarketsListProps) => {
  const store = useStore();
  const { markets: marketsStore } = store;
  const [filters, setFilters] = useState<MarketFilter[]>();
  const [orderBy, setOrderBy] = useState<MarketsOrderBy>();
  const [withLiquidityOnly, setWithLiquidityOnly] = useState<boolean>();

  const { ref: loadMoreRef, inView: isLoadMarkerInView } = useInView();

  const [scrollTop, scrollTo] = useContentScrollTop();
  const [scrollingRestored, setScrollingRestored] = useState(false);

  useChangeQuery(filters, orderBy, withLiquidityOnly);
  const [gridColsClass, setGridColsClass] = useState<string>("grid-cols-3");
  const contentWidth = useContentWidth();

  const {
    data: marketsPages,
    isFetching: isFetchingMarkets,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMarkets(orderBy, withLiquidityOnly, filters);

  useEffect(
    debounce(() => {
      if (scrollingRestored) {
        scrollRestoration.set(scrollTop);
      }
    }, 50),
    [scrollTop, scrollingRestored],
  );

  useEffect(() => {
    if (isLoadMarkerInView === true && hasNextPage === true) {
      fetchNextPage();
    }
  }, [isLoadMarkerInView, hasNextPage]);

  const [markets, setMarkets] = useState<
    (IndexedMarket<Context> & {
      outcomes: MarketOutcomes;
      prediction: { name: string; price: number };
    })[]
  >();

  useEffect(() => {
    const markets =
      marketsPages?.pages.flatMap((markets) => markets.data) ?? [];
    setMarkets(markets);
  }, [marketsPages?.pages]);

  const count = markets?.length ?? 0;

  useEffect(() => {
    if (!scrollingRestored && count > 0) {
      scrollTo(scrollRestoration.scrollTop);
      setScrollingRestored(true);
    }
  }, [scrollingRestored, scrollRestoration.scrollTop, count]);

  useEffect(() => {
    const pageNum = marketsPages?.pages.length ?? 0;
    if (pageNum > 0) {
      for (const market of marketsPages.pages[pageNum - 1].data) {
        marketsStore.getMarket(market.marketId);
      }
    }
  }, [marketsPages]);

  useEffect(() => {
    if (contentWidth <= 620) {
      return setGridColsClass("grid-cols-1");
    }
    if (contentWidth <= 915) {
      return setGridColsClass("grid-cols-2");
    }
    setGridColsClass("grid-cols-3");
  }, [contentWidth]);

  return (
    <div
      className={"pt-ztg-46 mb-[38px]" + className}
      data-testid="marketsList"
    >
      <MarketFilterSelection
        onFiltersChange={setFilters}
        onOrderingChange={setOrderBy}
        onWithLiquidityOnlyChange={setWithLiquidityOnly}
      />
      <div className={`grid grid-cols-3 gap-[30px] ${gridColsClass}`}>
        {markets?.map((market) => {
          const volume = market.pool?.volume ?? 0;
          const scalarType = market.scalarType as ScalarRangeType;
          return (
            <MarketCard
              marketId={market.marketId}
              outcomes={market.outcomes}
              question={market.question}
              creation={market.creation}
              img={market.img}
              prediction={market.prediction}
              endDate={market.period.end}
              marketType={market.marketType}
              scalarType={scalarType}
              status={market.status}
              baseAsset={market.pool?.baseAsset}
              volume={new Decimal(volume).div(ZTG).toNumber()}
              tags={market.tags}
              key={`market-${market.marketId}`}
            />
          );
        })}
      </div>
      <div className="flex justify-center w-full mt-[78px] h-[20px]">
        {(isFetchingMarkets || isLoading) && <Loader />}
      </div>
      {!isLoading && count === 0 && (
        <div className="text-center">No results!</div>
      )}
      <div
        className="w-full h-0"
        style={
          isFetchingMarkets || !hasNextPage
            ? { position: "absolute", left: "-10000px" }
            : {}
        }
        ref={loadMoreRef}
      ></div>
    </div>
  );
});

const MarketsSearchInfo = observer(({ searchText }: { searchText: string }) => {
  const router = useRouter();

  return (
    <div className="flex my-ztg-30 h-ztg-34">
      <h6 className="text-ztg-[24px]" id="marketsHead">
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
