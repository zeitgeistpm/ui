import { FC } from "react";
import Link from "next/link";
import { ChevronLeft } from "react-feather";
import { ChevronRight } from "react-feather";

interface HorizontalScrollProps {
  classes?: string;
  cta?: string;
  link?: string;
  handleLeftClick: () => void;
  handleRightClick: () => void;
  rightDisabled: boolean;
  leftDisabled: boolean;
}

const HorizontalScroll: FC<HorizontalScrollProps> = ({
  classes,
  cta,
  link,
  handleRightClick,
  handleLeftClick,
  rightDisabled,
  leftDisabled,
}) => {
  return (
    <div
      className={`flex md:ml-auto w-full items-center justify-end ${classes}`}
    >
      {link && (
        <Link
          href={link}
          className="leading-[40px] rounded-ztg-100 text-ztg-14-150 bg-mystic px-[15px] text-center w-full sm:w-fit"
          data-testid="horizontalScroll__cta"
        >
          {cta}
        </Link>
      )}
      <button
        onClick={handleLeftClick}
        className={`hidden md:flex items-center justify-center w-[40px] h-[40px] rounded-full ml-[12px] mr-[8px] ztg-transition ${
          leftDisabled
            ? "bg-sky-600 opacity-30 text-pastel-blue"
            : "bg-pastel-blue text-white"
        }`}
        disabled={leftDisabled}
        data-testid="horizontalScroll__leftBtn"
      >
        <ChevronLeft className="relative right-[1px]" />
      </button>
      <button
        onClick={handleRightClick}
        className={`hidden md:flex items-center justify-center w-[40px] h-[40px] rounded-full ztg-transition  ${
          rightDisabled
            ? "bg-sky-600 opacity-30 text-pastel-blue"
            : "bg-pastel-blue text-white"
        }`}
        disabled={rightDisabled}
        data-testid="horizontalScroll__rightBtn"
      >
        <ChevronRight className="relative left-[1px]" />
      </button>
    </div>
  );
};

export default HorizontalScroll;
