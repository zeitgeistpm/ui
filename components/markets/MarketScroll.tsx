import { motion } from "framer-motion";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { useResizeDetector } from "react-resize-detector";
import MarketCard, { IndexedMarketCardData } from "./market-card";

const MarketScroll = observer(
  ({ title, markets }: { title: string; markets: IndexedMarketCardData[] }) => {
    const scrollRef = useRef<HTMLDivElement>();
    const [scrollLeft, setScrollLeft] = useState(0);
    const { width: containerWidth, ref: containerRef } = useResizeDetector();
    const cardWidth = 320;
    const gap = 30;
    const scrollMin = 0;
    const scrollMax = cardWidth * markets.length + gap * (markets.length - 1);
    const cardsShown = Math.floor(containerWidth / (gap + cardWidth));
    const moveSize = cardsShown * (cardWidth + gap);

    const handleRightClick = () => {
      setScrollLeft((prev) => {
        const newScroll = prev - moveSize;
        const max = scrollMax - containerWidth;

        return newScroll * -1 > max ? -(scrollMax - containerWidth) : newScroll;
      });
    };

    const handleLeftClick = () => {
      setScrollLeft((prev) => {
        const newScroll = prev + moveSize;

        return newScroll > scrollMin ? scrollMin : newScroll;
      });
    };

    //todo: recalculate when drawer changes
    //todo: should always return true for mobile
    const isInView = (index: number) => {
      const xPosition = scrollLeft * -1;
      const itemWidth = gap + cardWidth;
      const cardsBeforeView = Math.ceil(xPosition / itemWidth);

      //card is outside the view port to the left
      if (index < cardsBeforeView) {
        return false;
      }
      const cardsDisplayed = Math.ceil(containerWidth / itemWidth);

      if (index >= cardsBeforeView + cardsDisplayed) {
        return false;
      }

      return true;
    };

    //todo: review these for 3 or less markets
    const leftDisabled = scrollLeft === 0;
    const rightDisabled = scrollMax - containerWidth + scrollLeft === 0;

    return (
      <div ref={containerRef} className="flex flex-col">
        <div className="flex items-center mb-ztg-30">
          <div className="font-lato font-bold text-[28px]">{title}</div>
          <div className="hidden sm:flex ml-auto items-center">
            <Link
              href="markets"
              className="text-ztg-14-150 border-2 border-pastel-blue rounded-[5px] px-[10px] py-[3px]"
            >
              Go To Markets
            </Link>
            <button
              onClick={handleLeftClick}
              className={`flex items-center justify-center w-[26px] h-[26px] rounded-full ml-[12px] mr-[8px] ztg-transition ${
                leftDisabled
                  ? "bg-geyser text-pastel-blue"
                  : "bg-pastel-blue text-white"
              }`}
              disabled={leftDisabled}
            >
              <ChevronLeft className="relative right-[1px]" />
            </button>
            <button
              onClick={handleRightClick}
              className={`flex items-center justify-center w-[26px] h-[26px] rounded-full ztg-transition  ${
                rightDisabled
                  ? "bg-geyser text-pastel-blue"
                  : "bg-pastel-blue text-white"
              }`}
              disabled={rightDisabled}
            >
              <ChevronRight className="relative left-[1px]" />
            </button>
          </div>
        </div>
        {/* <div className="flex h-[175px] gap-x-[30px] overflow-auto"> */}
        <div className="relative">
          {/* <div
            className="bg-gradient-to-r from-indigo-500 h-[175px] w-[1000px] absolute -left-[800px]"
            style={{ zIndex: 10 }}
          ></div> */}
          <motion.div
            ref={scrollRef}
            animate={{ x: scrollLeft }}
            transition={{ duration: 0.5, type: "tween" }}
            className="flex h-[175px] gap-x-[30px] no-scroll-bar overflow-x-auto sm:overflow-x-visible"
          >
            {markets.map((market, index) => (
              // <div
              //   key={index}
              //   className={`bg-anti-flash-white rounded-ztg-10 min-w-[320px] w-full transition duration-1000 ease-in-out ${
              //     isInView(index) === false ? "opacity-0" : ""
              //   }`}
              // >
              //   {market.question}
              // </div>

              <MarketCard
                key={market.marketId}
                {...market}
                className={`bg-anti-flash-white rounded-ztg-10 min-w-[320px] w-full transition duration-500 ease-in-out ${
                  isInView(index) === false ? "opacity-0" : ""
                }`}
              />
            ))}
          </motion.div>
          {/* <div className="bg-gradient-to-l from-white  h-[175px] w-[80px] absolute -right-[60px] top-[0px]"></div> */}
        </div>
      </div>
    );
  },
);

export default MarketScroll;
