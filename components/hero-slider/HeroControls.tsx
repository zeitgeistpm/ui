import { Banner } from "lib/cms/get-banners";
import { UseSliderControls } from "lib/hooks/slides";
import { FC } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";

export interface HeroControlsProps {
  slides: Banner[];
  slider: UseSliderControls;
}

export const HeroControls: FC<HeroControlsProps> = ({ slides, slider }) => {
  return (
    <div className="flex items-center justify-center md:justify-end gap-1">
      <button
        onClick={() => {
          slider.prev(true);
        }}
        className={`bg-black border border-white flex items-center justify-center w-[40px] h-[40px] rounded-full`}
      >
        <ChevronLeft className="text-white relative right-[1px]" />
      </button>
      <div className="text-white">
        {slides.map((slide, index) => (
          <span
            onClick={() => {
              slider.goto(index, true);
            }}
            className={`cursor-pointer text-[48px] px-1 ${
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
        className={`bg-black border border-white flex items-center justify-center w-[40px] h-[40px] rounded-full ztg-transition`}
      >
        <ChevronRight className="text-white relative left-[1px]" />
      </button>
    </div>
  );
};
