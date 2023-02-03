import { FC } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { moveSlider } from "./slider-controls";
import { HeroControlsProps } from "./slider-types";

export const HeroControls: FC<HeroControlsProps> = ({
  slides,
  slidesLength,
  currentSlide,
  setAnimate,
  setCurrentSlide,
}) => {
  return (
    <div className="flex items-center justify-center md:justify-end w-full mx-auto gap-1 pb-16 absolute bottom-0">
      <button
        onClick={() => {
          setAnimate(true);
          moveSlider("next", currentSlide, setCurrentSlide, slidesLength);
        }}
        className={`bg-black border border-white flex items-center justify-center w-[40px] h-[40px] rounded-full`}
      >
        <ChevronLeft className="text-white relative right-[1px]" />
      </button>
      <div className="text-white">
        {slides.map((slide, index) => (
          <span
            onClick={() => {
              setAnimate(true);
              moveSlider(
                "goto",
                currentSlide,
                setCurrentSlide,
                slidesLength,
                index,
              );
            }}
            className={`cursor-pointer text-[48px] px-1 ${
              index === currentSlide ? "text-white" : "opacity-50"
            }`}
            key={index}
          >
            &middot;
          </span>
        ))}
      </div>
      <button
        onClick={() => {
          setAnimate(true);
          moveSlider("prev", currentSlide, setCurrentSlide, slidesLength);
        }}
        className={`bg-black border border-white flex items-center justify-center w-[40px] h-[40px] rounded-full ztg-transition`}
      >
        <ChevronRight className="text-white relative left-[1px]" />
      </button>
    </div>
  );
};
