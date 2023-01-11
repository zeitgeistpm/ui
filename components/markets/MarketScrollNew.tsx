import { motion } from "framer-motion";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { useResizeDetector } from "react-resize-detector";
import MarketCard, { IndexedMarketCardData } from "./market-card";
import HorizontalScroll from "components/ui/HorizontalScroll";

const MarketScrollNew = observer(
  ({
    title,
    markets,
    showMarketsLink = true,
  }: {
    title: string;
    markets: IndexedMarketCardData[];
    showMarketsLink?: boolean;
  }) => {
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
    const cardsShown = Math.floor(containerWidth / (gap + cardWidth));
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
    const rightDisabled = hasReachedEnd || markets.length <= 3;

    return (
      <div ref={containerRef} className="flex flex-col">
        <div className="flex items-center mb-ztg-30">
          <div className=" font-bold text-[28px]">{title}</div>
          <HorizontalScroll
            showLink={showMarketsLink}
            link="markets"
            handleLeftClick={handleLeftClick}
            handleRightClick={handleRightClick}
            rightDisabled={rightDisabled}
            leftDisabled={leftDisabled}
          />
        </div>
        <div className="relative">
          {(scrollDirection === "left" && scrollLeft !== 0) ||
          (scrollDirection === "right" && hasReachedEnd) ? (
            <div className="bg-gradient-to-r from-white w-[20px] absolute z-ztg-10 -left-[5px]"></div>
          ) : (
            <div className="bg-gradient-to-r from-transparent to-white w-[20px] absolute z-ztg-10 -right-[5px]"></div>
          )}
          <div
            ref={scrollRef}
            className="flex gap-x-[30px] no-scroll-bar overflow-x-auto"
          >
            {markets.map((market) => (
              <MarketCard
                key={market.marketId}
                {...market}
                className="market-card bg-anti-flash-white rounded-ztg-10 min-w-[320px] w-[320px] transition duration-500 ease-in-out"
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
);

export default MarketScrollNew;
