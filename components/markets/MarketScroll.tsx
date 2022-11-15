import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";

interface MarketCardData {}

interface MarketScrollProps {
  question: string;
}

const MarketScroll = ({
  title,
  markets,
}: {
  title: string;
  markets: MarketScrollProps[];
}) => {
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

  return (
    <div ref={containerRef} className="flex flex-col">
      <div className="flex items-center mb-ztg-30">
        <div className="font-lato font-bold text-[28px]">{title}</div>
        <div className="hidden sm:flex ml-auto">
          <button
            onClick={handleLeftClick}
            className="w-[20px] h-[20px] bg-blue-600 mr-[10px]"
          ></button>
          <button
            onClick={handleRightClick}
            className="w-[20px] h-[20px] bg-red-600"
          ></button>
        </div>
      </div>
      {/* <div className="flex h-[175px] gap-x-[30px] overflow-auto"> */}
      <motion.div
        ref={scrollRef}
        animate={{ x: scrollLeft }}
        transition={{ duration: 0.5, type: "tween" }}
        className="flex h-[175px] gap-x-[30px] no-scroll-bar overflow-x-auto sm:overflow-x-visible"
      >
        {markets.map((market) => (
          <div className="bg-anti-flash-white rounded-ztg-10 min-w-[320px] w-full">
            {market.question}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default MarketScroll;
