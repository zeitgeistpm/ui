import React, { useEffect, useState, useRef } from "react";
import { useInView } from "react-intersection-observer";

import Loader from "react-spinners/PulseLoader";
import { useInfiniteMarkets } from "lib/hooks/queries/useInfiniteMarkets";
import { useInfiniteMultiMarkets } from "lib/hooks/queries/useInfiniteMultiMarkets";
import { MarketFilter, MarketsOrderBy, MarketType } from "lib/types/market-filter";
import MarketFilterSelection from "./market-filter";
import MarketOrComboCard from "./market-card/MarketOrComboCard";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";
import { filterTypes } from "lib/constants/market-filter";

export type MarketsListProps = {
  className?: string;
};

const useChangeQuery = (
  filters?: MarketFilter[],
  orderBy?: MarketsOrderBy,
  withLiquidityOnly?: boolean,
  marketType?: MarketType,
) => {
  const queryState = useMarketsUrlQuery();
  const updateQueryRef = useRef(queryState.updateQuery);

  // Keep ref updated
  useEffect(() => {
    updateQueryRef.current = queryState.updateQuery;
  });

  useEffect(() => {
    if (filters == null) {
      return;
    }
    const newFilters = {};
    for (const filterType of filterTypes) {
      const filterByType = filters.filter((f) => f.type === filterType);
      newFilters[filterType] = filterByType.map((f) => f.value);
    }
    updateQueryRef.current({
      filters: newFilters,
    });
  }, [filters]);

  useEffect(() => {
    if (orderBy == null) {
      return;
    }
    updateQueryRef.current({ ordering: orderBy });
  }, [orderBy]);

  useEffect(() => {
    if (withLiquidityOnly == null) {
      return;
    }
    updateQueryRef.current({ liquidityOnly: withLiquidityOnly });
  }, [withLiquidityOnly]);

  useEffect(() => {
    if (marketType == null) {
      return;
    }
    updateQueryRef.current({ marketType });
  }, [marketType]);
};

const MarketsList = ({ className = "" }: MarketsListProps) => {
  const [filters, setFilters] = useState<MarketFilter[]>();
  const [orderBy, setOrderBy] = useState<MarketsOrderBy>();
  const [withLiquidityOnly, setWithLiquidityOnly] = useState<boolean>();
  const [marketType, setMarketType] = useState<MarketType>();

  const { ref: loadMoreRef, inView: isLoadMarkerInView } = useInView();

  const queryState = useMarketsUrlQuery();

  useChangeQuery(filters, orderBy, withLiquidityOnly, marketType);

  // Conditionally fetch the appropriate data based on market type
  const isMultiMarket = queryState.marketType === "multi";

  // Only fetch regular markets when not in multi-market mode
  const regularMarketsQuery = useInfiniteMarkets(
    queryState.ordering,
    queryState.liquidityOnly,
    queryState.filters,
  );

  // Only fetch multi-markets when in multi-market mode
  const multiMarketsQuery = useInfiniteMultiMarkets(
    queryState.ordering,
    queryState.filters,
  );

  // Use the appropriate query based on market type
  const activeQuery = isMultiMarket ? multiMarketsQuery : regularMarketsQuery;

  const {
    data: marketsPages,
    isFetching: isFetchingMarkets,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = activeQuery;

  useEffect(() => {
    if (isLoadMarkerInView === true && hasNextPage === true) {
      fetchNextPage();
    }
  }, [isLoadMarkerInView, hasNextPage]);

  const marketItems = marketsPages?.pages.flatMap((page) => page.data) ?? [];

  const count = marketItems?.length ?? 0;

  return (
    <div
      className={"mb-[38px] scroll-mt-[40px] " + className}
      data-testid="marketsList"
      id={"market-list"}
    >
      <MarketFilterSelection
        onFiltersChange={setFilters}
        onOrderingChange={setOrderBy}
        onWithLiquidityOnlyChange={setWithLiquidityOnly}
        onMarketTypeChange={setMarketType}
      />

      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
        {marketItems?.map((item) => {
          return (
            <MarketOrComboCard
              key={`${item.type}-${item.type === 'market' ? item.data.marketId : item.data.poolId}`}
              item={item}
            />
          );
        })}
      </div>
      <div className="mt-[78px] flex h-[20px] w-full justify-center">
        {(isFetchingMarkets || isLoading) && <Loader />}
      </div>
      {!(isFetchingMarkets || isLoading) && count === 0 && (
        <div className="text-center">No results!</div>
      )}
      <div
        className="h-0 w-full"
        style={
          isFetchingMarkets || !hasNextPage
            ? { position: "absolute", left: "-10000px" }
            : {}
        }
        ref={loadMoreRef}
      ></div>
    </div>
  );
};


export default MarketsList;
