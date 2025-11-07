import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Loader } from "components/ui/Loader";
import { useInfiniteMarkets } from "lib/hooks/queries/useInfiniteMarkets";
import { useInfiniteMultiMarkets } from "lib/hooks/queries/useInfiniteMultiMarkets";
import MarketOrComboCard from "./market-card/MarketOrComboCard";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";

export type MarketsListProps = {
  className?: string;
};

const MarketsList = ({ className = "" }: MarketsListProps) => {
  const { ref: loadMoreRef, inView: isLoadMarkerInView } = useInView();

  const queryState = useMarketsUrlQuery();

  // Conditionally fetch the appropriate data based on market type
  const isMultiMarket = queryState.marketType === "multi";

  // Only fetch regular markets when not in multi-market mode
  const regularMarketsQuery = useInfiniteMarkets(
    queryState.ordering,
    queryState.liquidityOnly,
    queryState.filters,
    { enabled: !isMultiMarket },
  );

  // Only fetch multi-markets when in multi-market mode
  const multiMarketsQuery = useInfiniteMultiMarkets(
    queryState.ordering,
    queryState.filters,
    { enabled: isMultiMarket },
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
  }, [isLoadMarkerInView, hasNextPage, fetchNextPage]);

  const marketItems = marketsPages?.pages.flatMap((page) => page.data) ?? [];

  const count = marketItems?.length ?? 0;

  // Determine loading states
  const isInitialLoading = isLoading && count === 0;
  const isFetchingMore = isFetchingMarkets && count > 0;

  return (
    <div
      className={"mb-[38px] " + className}
      data-testid="marketsList"
      id={"market-list"}
    >
      {/* Initial loading state - centered */}
      {isInitialLoading ? (
        <div className="flex min-h-[400px] w-full items-center justify-center">
          <Loader className="w-32" type="dots" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {marketItems?.map((item) => {
              return (
                <MarketOrComboCard
                  key={`${item.type}-${item.type === "market" ? item.data.marketId : item.data.poolId}`}
                  item={item}
                />
              );
            })}
          </div>

          {/* Pagination loader - at bottom when fetching more */}
          {isFetchingMore && (
            <div className="mt-[78px] flex w-full justify-center">
              <Loader className="w-32" type="dots" />
            </div>
          )}

          {/* Empty state - only show when not loading and no data */}
          {!isInitialLoading && !isFetchingMore && count === 0 && (
            <div className="mt-[78px] text-center text-white/70">
              No results!
            </div>
          )}
        </>
      )}

      {/* Infinite scroll trigger */}
      <div
        className="h-0 w-full"
        style={
          isFetchingMore || !hasNextPage
            ? { position: "absolute", left: "-10000px" }
            : {}
        }
        ref={loadMoreRef}
      ></div>
    </div>
  );
};

export default MarketsList;
