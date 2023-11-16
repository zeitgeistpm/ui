import HorizontalScroll from "components/ui/HorizontalScroll";
import { BREAKPOINTS } from "lib/constants/breakpoints";
import { useWindowSize } from "lib/hooks/events/useWindowSize";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { range } from "lodash-es";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import MarketCard, { IndexedMarketCardData } from "./market-card/index";
import { useDebouncedCallback } from "use-debounce";
import { useHasMounted } from "lib/hooks/events/useHasMounted";

const MarketScroll = ({
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const { width: windowWidth } = useWindowSize();
  const { width, ref: containerRef } = useResizeDetector();
  const containerWidth = width || 0;

  // Will only be true on the client.
  // So enables two pass rendering and updating of the card visibility
  // based on the window width which is only available when it mounts on the client.
  // @note Without this the className wont update correctly when the component initially renders on the client
  const hasMounted = useHasMounted();

  const { data: marketsStats } = useMarketsStats(
    markets.map((m) => m.marketId),
  );

  const gap = 16;

  //calculate cards shown and width based on container width
  const cardsShown =
    windowWidth < BREAKPOINTS.md ? 1 : windowWidth < BREAKPOINTS.lg ? 2 : 3;

  const cardWidth = (containerWidth - gap * (cardsShown - 1)) / cardsShown;

  const handleRightClick = () => {
    setPageIndex(pageIndex + 1);
  };

  const handleLeftClick = () => {
    setPageIndex(pageIndex - 1);
  };

  const showRange = range(pageIndex, pageIndex + cardsShown);
  const hasReachedEnd = showRange.includes(markets.length - 1);
  const leftDisabled = pageIndex === 0;
  const rightDisabled =
    hasReachedEnd || cardWidth * markets.length < containerWidth;

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setIsResizing(true);
  }, [width]);

  useEffect(
    useDebouncedCallback(() => {
      setPageIndex(0);
      setTimeout(() => setIsResizing(false), 66);
    }, 120),
    [width],
  );

  if (!hasMounted) {
    markets = markets.slice(0, cardsShown);
  }

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 gap-y-7 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3"
    >
      <h2 className="text-center sm:col-span-2 sm:text-start">{title}</h2>
      <HorizontalScroll
        classes="order-2 sm:order-none"
        link={link}
        cta={cta}
        handleLeftClick={handleLeftClick}
        handleRightClick={handleRightClick}
        rightDisabled={rightDisabled}
        leftDisabled={leftDisabled}
      />
      <div className="relative col-span-3">
        <div
          ref={scrollRef}
          style={{
            transform: `translateX(${
              windowWidth < BREAKPOINTS.sm
                ? 0
                : -(showRange[0] * cardWidth + pageIndex * gap)
            }px)`,
          }}
          className={`flex ${
            !isResizing && "ztg-transition transition-transform"
          } no-scroll-bar flex-col gap-4 scroll-smooth  whitespace-nowrap sm:flex-row`}
        >
          {markets.map((market, cardIndex) => {
            const stat = marketsStats?.find(
              (s) => s.marketId === market.marketId,
            );

            const isShown =
              showRange.includes(cardIndex) || windowWidth < BREAKPOINTS.md;

            market = {
              ...market,
              numParticipants: stat?.participants,
              liquidity: stat?.liquidity,
            };

            return (
              <MarketCard
                key={market.marketId}
                disableLink={!isShown}
                className={`market-card rounded-ztg-10 transition duration-500 ease-in-out ${
                  isShown ? "opacity-1" : "opacity-0"
                }`}
                {...market}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketScroll;
