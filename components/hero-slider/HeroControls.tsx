import { News } from "lib/cms/get-news";
import { UseSliderControls } from "lib/hooks/slides";
import { FC } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";

export interface HeroControlsProps {
  slides: News[];
  slider: UseSliderControls;
}

export const HeroControls: FC<HeroControlsProps> = ({ slides, slider }) => {
  return (
    <div className="absolute bottom-0 right-0 mx-auto flex w-full items-center justify-center gap-1 px-[inherit] pb-16 md:justify-end">
      <button
        onClick={() => {
          slider.prev(true);
        }}
        className={`flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white bg-black`}
      >
        <ChevronLeft className="relative right-[1px] text-white" />
      </button>
      <div className="text-white">
        {slides.map((slide, index) => (
          <span
            onClick={() => {
              slider.goto(index, true);
            }}
            className={`cursor-pointer px-1 text-[48px] ${
              index === slider.currentSlide ? "text-white" : "opacity-50"
            }`}
            key={index}
          >
            &middot;
          </span>
        ))}
      </div>
      <button
        onClick={() => {
          slider.next(true);
        }}
        className={`ztg-transition flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white bg-black`}
      >
        <ChevronRight className="relative left-[1px] text-white" />
      </button>
    </div>
  );
};
