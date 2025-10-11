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
      <div className="mt-[78px] flex w-full justify-center">
        {(isFetchingMarkets || isLoading) && (
          <Loader className="w-32" type="dots" />
        )}
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
