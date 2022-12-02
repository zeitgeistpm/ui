import { motion } from "framer-motion";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { useResizeDetector } from "react-resize-detector";
import MarketCard, { IndexedMarketCardData } from "./market-card";

const MarketScroll = observer(
  ({ title, markets }: { title: string; markets: IndexedMarketCardData[] }) => {
    const store = useStore();
    const scrollRef = useRef<HTMLDivElement>();
    const [scrollLeft, setScrollLeft] = useState(0);
    const { width: containerWidth, ref: containerRef } = useResizeDetector();
    const cardWidth = 320;
    const gap = 30;
    const scrollMin = 0;
    const scrollMax = cardWidth * markets.length + gap * (markets.length - 1);
    const cardsShown = Math.floor(containerWidth / (gap + cardWidth));
    const moveSize = cardsShown * (cardWidth + gap);

    useEffect(() => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 640) return;

      const cards = document.querySelectorAll(".market-card");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.remove("opacity-0");
            } else {
              entry.target.classList.add("opacity-0");
            }
          });
        },
        { root: containerRef.current, threshold: 0.7 },
      );

      cards.forEach((card) => {
        observer.observe(card);
      });

      return () => observer.disconnect();
    }, [
      store.leftDrawerClosed,
      store.rightDrawerClosed,
      store.leftDrawerAnimating,
      store.rightDrawerAnimating,
    ]);

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

    const leftDisabled = scrollLeft === 0;
    const rightDisabled =
      scrollMax - containerWidth + scrollLeft === 0 || markets.length <= 3;

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
        <div className="relative">
          <motion.div
            ref={scrollRef}
            animate={{ x: scrollLeft }}
            transition={{ duration: 0.5, type: "tween" }}
            className="flex h-[175px] gap-x-[30px] no-scroll-bar overflow-x-auto sm:overflow-x-visible"
          >
            {markets.map((market) => (
              <MarketCard
                key={market.marketId}
                {...market}
                className="market-card bg-anti-flash-white rounded-ztg-10 min-w-[320px] w-[320px] transition duration-500 ease-in-out"
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  },
);

export default MarketScroll;
