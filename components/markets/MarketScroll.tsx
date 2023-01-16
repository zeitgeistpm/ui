import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import MarketCard, { IndexedMarketCardData } from "./market-card/index";
import HorizontalScroll from "components/ui/HorizontalScroll";

const MarketScroll = observer(
  ({ title, markets }: { title: string; markets: IndexedMarketCardData[] }) => {
    const scrollRef = useRef<HTMLDivElement>();
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollDirection, setScrollDirection] = useState<"left" | "right">(
      "right",
    );
    const { width: containerWidth, ref: containerRef } = useResizeDetector();
    const cardWidth = 320;
    const gap = 30;
    const scrollMin = 0;
    const scrollMax = cardWidth * markets.length + gap * (markets.length - 1);
    // const cardsShown = Math.floor(containerWidth / (gap + cardWidth));
    const cardsShown =
      containerWidth < 716
        ? 3
        : containerWidth >= 716 && containerWidth < 1183
        ? 2
        : 3;
    const moveSize = cardsShown * (cardWidth + gap);

    useEffect(() => {
      scrollRef.current.scroll({ left: scrollLeft, behavior: "smooth" });
    }, [scrollRef, scrollLeft]);

    const handleRightClick = () => {
      setScrollDirection("right");
      setScrollLeft((prev) => {
        const newScroll = prev + moveSize;
        const max = scrollMax - containerWidth;

        return newScroll > max ? scrollMax - containerWidth : newScroll;
      });
    };

    const handleLeftClick = () => {
      setScrollDirection("left");
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
      <div ref={containerRef} className="grid sm:grid-cols-2 gap-4 md:gap-6">
        <h3 className="sm:col-span-1 font-bold text-[28px]">{title}</h3>
        <HorizontalScroll
          classes="order-2 sm:order-none"
          link="markets"
          title="Go To Markets"
          handleLeftClick={handleLeftClick}
          handleRightClick={handleRightClick}
          rightDisabled={rightDisabled}
          leftDisabled={leftDisabled}
        />
        {/* <div className="flex items-center mb-ztg-30">
        </div> */}
        <div className="sm:col-span-2 relative">
          {(scrollDirection === "left" && scrollLeft !== 0) ||
          (scrollDirection === "right" && hasReachedEnd) ? (
            <div className="bg-gradient-to-r from-white w-[20px] absolute z-ztg-10 -left-[5px]"></div>
          ) : (
            <div className="bg-gradient-to-r from-transparent to-white w-[20px] absolute z-ztg-10 -right-[5px]"></div>
          )}
          <div
            ref={scrollRef}
            className="flex flex-col md:flex-row gap-4 no-scroll-bar overflow-x-auto"
          >
            {markets.map(
              (market, index) =>
                index < cardsShown && (
                  <MarketCard
                    key={market.marketId}
                    {...market}
                    className="market-card bg-anti-flash-white rounded-ztg-10 transition duration-500 ease-in-out"
                  />
                ),
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default MarketScroll;
