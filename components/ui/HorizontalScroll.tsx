import { FC } from "react";
import Link from "next/link";
import { ChevronLeft } from "react-feather";
import { ChevronRight } from "react-feather";
import { useResizeDetector } from "react-resize-detector";
import { IndexedMarketCardData } from "components/markets/market-card";

interface HorizontalScrollProps {
  showLink?: boolean;
  link: string;
  handleLeftClick: () => void;
  handleRightClick: () => void;
  rightDisabled: boolean;
  leftDisabled: boolean;
}

const HorizontalScroll: FC<HorizontalScrollProps> = ({
  showLink,
  link,
  handleRightClick,
  handleLeftClick,
  rightDisabled,
  leftDisabled,
}) => {
  return (
    <div className="flex ml-auto items-center">
      {showLink && (
        <Link
          href={link}
          className="text-ztg-14-150 border-2 border-pastel-blue rounded-[5px] px-[10px] py-[3px]"
        >
          Go To Markets
        </Link>
      )}
      <button
        onClick={handleLeftClick}
        className={`hidden sm:flex items-center justify-center w-[26px] h-[26px] rounded-full ml-[12px] mr-[8px] ztg-transition ${
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
        className={`hidden sm:flex items-center justify-center w-[26px] h-[26px] rounded-full ztg-transition  ${
          rightDisabled
            ? "bg-geyser text-pastel-blue"
            : "bg-pastel-blue text-white"
        }`}
        disabled={rightDisabled}
      >
        <ChevronRight className="relative left-[1px]" />
      </button>
    </div>
  );
};

export default HorizontalScroll;
