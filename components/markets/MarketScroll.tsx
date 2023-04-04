import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import MarketCard, { IndexedMarketCardData } from "./market-card/index";
import HorizontalScroll from "components/ui/HorizontalScroll";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { useWindowSize } from "lib/hooks/useWindowSize";
import { BREAKPOINTS } from "lib/constants/breakpoints";

const MarketScroll = observer(
  ({
    title,
    cta,
    markets,
    link,
  }: {
    title: string;
    cta?: string;
    markets: IndexedMarketCardData[];
    link?: string;
  }) => {
    const scrollRef = useRef<HTMLDivElement>();
    const [scrollLeft, setScrollLeft] = useState(0);

    const { width: windowWidth } = useWindowSize();
    const { width: containerWidth, ref: containerRef } = useResizeDetector();
    const { data: marketsStats } = useMarketsStats(
      markets.map((m) => m.marketId),
    );

    const gap = 28;

    //calculate cards shown and width based on container width

    const cardsShown = windowWidth < BREAKPOINTS.lg ? 2 : 3;
    const cardWidth =
      windowWidth < BREAKPOINTS.md
        ? containerWidth
        : windowWidth < BREAKPOINTS.lg
        ? (containerWidth - gap) / cardsShown
        : (containerWidth - gap * 2) / cardsShown;
    const scrollMin = 0;
    const scrollMax = cardWidth * markets.length + gap * (markets.length - 1);

    const moveSize = cardsShown * (cardWidth + gap);
    useEffect(() => {
      scrollRef.current.scroll({ left: scrollLeft, behavior: "smooth" });
    }, [scrollRef, scrollLeft]);

    const handleRightClick = () => {
      setScrollLeft((prev) => {
        const newScroll = prev + moveSize;
        const max = scrollMax - containerWidth;
        return newScroll > max ? scrollMax - containerWidth : newScroll;
      });
    };

    const handleLeftClick = () => {
      setScrollLeft((prev) => {
        const newScroll = prev - moveSize;

        return newScroll < scrollMin ? scrollMin : newScroll;
      });
    };

    const hasReachedEnd = scrollMax - containerWidth - scrollLeft === 0;
    const leftDisabled = scrollLeft === 0;
    const rightDisabled =
      hasReachedEnd || cardWidth * markets.length < containerWidth;

    return (
      <div
        ref={containerRef}
        className="grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        <h2 className="sm:col-span-2">{title}</h2>
        <HorizontalScroll
          classes="order-2 sm:order-none"
          link={link}
          cta={cta}
          handleLeftClick={handleLeftClick}
          handleRightClick={handleRightClick}
          rightDisabled={rightDisabled}
          leftDisabled={leftDisabled}
        />
        <div className="col-span-3 relative">
          <div
            ref={scrollRef}
            className="flex flex-col gap-7 md:flex-row no-scroll-bar overflow-x-auto whitespace-nowrap scroll-smooth"
          >
            {markets.map((market) => {
              const stat = marketsStats?.find(
                (s) => s.marketId === market.marketId,
              );
              market = {
                ...market,
                numParticipants: stat?.participants,
                liquidity: stat?.liquidity,
              };
              return (
                <MarketCard
                  key={market.marketId}
                  {...market}
                  width={cardWidth}
                  className="market-card rounded-ztg-10 transition duration-500 ease-in-out"
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);

export default MarketScroll;
