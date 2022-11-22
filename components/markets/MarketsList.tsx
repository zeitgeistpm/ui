import { isIndexedData } from "@zeitgeistpm/sdk-next";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { observer } from "mobx-react";
import { X } from "react-feather";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import { useStore } from "lib/stores/Store";
import MarketCard from "./market-card";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";
import Loader from "react-spinners/PulseLoader";
import { makeAutoObservable } from "mobx";
import { useMarkets } from "lib/hooks/queries/useMarkets";
import { useContentScrollTop } from "components/context/ContentDimensionsContext";

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
  const query = useMarketsUrlQuery();
  const store = useStore();
  const { markets: marketsStore } = store;

  const { ref: loadMoreRef, inView: isLoadMarkerInView } = useInView();

  const [scrollTop, scrollTo] = useContentScrollTop();

  useEffect(
    debounce(() => {
      scrollRestoration.set(scrollTop);
    }, 150),
    [scrollTop],
  );

  const {
    data: marketsPages,
    isFetching: isFetchingMarkets,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useMarkets();

  useEffect(() => {
    if (isLoadMarkerInView === true && hasNextPage === true) {
      fetchNextPage();
    } else {
      scrollTo(scrollRestoration.scrollTop);
    }
  }, [isLoadMarkerInView, hasNextPage]);

  const markets = marketsPages?.pages.flatMap((markets) => markets.data) ?? [];
  const count = markets.length;

  useEffect(() => {
    const pageNum = marketsPages?.pages.length ?? 0;
    if (pageNum > 0) {
      for (const market of marketsPages.pages[pageNum - 1].data) {
        marketsStore.getMarket(market.marketId);
      }
    }
  }, [marketsPages]);

  return (
    <div className={"pt-ztg-46 mb-[38px]" + className}>
      {/* TODO: Filters here */}
      <div></div>
      <div className="grid grid-cols-3 gap-[30px]">
        {query != null &&
          markets.map((market) => {
            if (!isIndexedData(market)) {
              throw Error(`Market with id ${market.marketId} cannot be shown.`);
            }
            return (
              <MarketCard
                marketId={market.marketId}
                categories={market.categories}
                question={market.question}
                creation={market.creation}
                baseAsset="ZTG"
                // prediction={prediction}
                volume={100}
                key={`market-${market.id}`}
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
          isFetchingMarkets ? { position: "absolute", left: "-10000px" } : {}
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
