import { FC } from "react";
import Link from "next/link";

import { HeroSlideProps } from "./slider-types";

export const HeroSlide: FC<HeroSlideProps> = ({ slide }) => {
  return (
    <div className="flex items-center h-full w-full">
      <div className="w-full pb-8">
        <h2 className={`text-center sm:text-left ${slide.title.styles}`}>
          {slide.title.text}
        </h2>
        <p className={slide.title?.stylesSecondary}>{slide.title?.secondary}</p>
        <div className="flex flex-col sm:flex-row">
          <Link
            style={{
              borderColor: `${slide.color1.border}`,
              backgroundColor: `${slide.color1.primary}`,
              color: `${slide.color1.secondary}`,
            }}
            className="leading-[42px] w-full sm:w-fit text-center sm:text-start border rounded px-5 mb-5 mr-5 font-bold"
            href={slide.link1}
          >
            {slide.cta1}
          </Link>
          {slide.cta2 && (
            <Link
              style={{
                borderColor: `${slide.color2.border}`,
                backgroundColor: `${slide.color2.primary}`,
                color: `${slide.color2.secondary}`,
              }}
              className="leading-[42px] w-full sm:w-fit text-center sm:text-start border rounded px-5 mb-5 font-bold"
              href={slide.link2}
              target="_blank"
            >
              {slide.cta2}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
