import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import Loader from "react-spinners/PulseLoader";
import { X } from "react-feather";
import { useRouter } from "next/router";
import { useInfiniteMarkets } from "lib/hooks/queries/useInfiniteMarkets";
import { MarketFilter, MarketsOrderBy } from "lib/types/market-filter";
import MarketFilterSelection from "./market-filter";
import MarketCard from "./market-card/index";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";
import { filterTypes } from "lib/constants/market-filter";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";

export type MarketsListProps = {
  className?: string;
};

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

const MarketsList = ({ className = "" }: MarketsListProps) => {
  const [filters, setFilters] = useState<MarketFilter[]>();
  const [orderBy, setOrderBy] = useState<MarketsOrderBy>();
  const [withLiquidityOnly, setWithLiquidityOnly] = useState<boolean>();

  const { ref: loadMoreRef, inView: isLoadMarkerInView } = useInView();

  const queryState = useMarketsUrlQuery();

  useChangeQuery(filters, orderBy, withLiquidityOnly);

  const {
    data: marketsPages,
    isFetching: isFetchingMarkets,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMarkets(
    queryState.ordering,
    queryState.liquidityOnly,
    queryState.filters,
  );

  useEffect(() => {
    if (isLoadMarkerInView === true && hasNextPage === true) {
      fetchNextPage();
    }
  }, [isLoadMarkerInView, hasNextPage]);

  const markets = marketsPages?.pages.flatMap((markets) => markets.data) ?? [];

  const count = markets?.length ?? 0;

  const { data: stats } = useMarketsStats(markets.map((m) => m.marketId));

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
      />

      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
        {markets?.map((market) => {
          const stat = stats?.find((s) => s.marketId === market.marketId);

          return (
            <MarketCard
              key={`market-${market.marketId}`}
              market={market}
              numParticipants={stat?.participants}
              liquidity={stat?.liquidity}
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

const MarketsSearchInfo = ({ searchText }: { searchText: string }) => {
  const router = useRouter();

  return (
    <div className="my-ztg-30 flex h-ztg-34">
      <h6 className="text-ztg-[24px]" id="marketsHead">
        {`Search results for: "${searchText}"`}
      </h6>
      <div className="center ml-ztg-15 h-ztg-24 w-ztg-24 rounded-full bg-sky-400 dark:bg-black">
        <X
          size={24}
          className="cursor-pointer text-sky-600"
          onClick={() => {
            router.push("/", "", { shallow: true });
          }}
        />
      </div>
    </div>
  );
};

export default MarketsList;
