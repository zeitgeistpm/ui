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
      className={`flex w-full items-center justify-end md:ml-auto ${classes}`}
    >
      {link && (
        <Link
          href={link}
          className="w-full rounded-ztg-100 bg-mystic px-[15px] text-center text-ztg-14-150 leading-[40px] sm:w-fit"
        >
          {cta}
        </Link>
      )}
      <button
        onClick={handleLeftClick}
        className={`ztg-transition ml-[12px] mr-[8px] hidden h-[40px] w-[40px] items-center justify-center rounded-full sm:flex ${
          leftDisabled
            ? "bg-sky-600 text-pastel-blue opacity-30"
            : "bg-pastel-blue text-white"
        }`}
        disabled={leftDisabled}
      >
        <ChevronLeft className="relative right-[1px]" />
      </button>
      <button
        onClick={handleRightClick}
        className={`ztg-transition hidden h-[40px] w-[40px] items-center justify-center rounded-full sm:flex  ${
          rightDisabled
            ? "bg-sky-600 text-pastel-blue opacity-30"
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
