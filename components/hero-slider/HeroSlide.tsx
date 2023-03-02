import { FC } from "react";
import Link from "next/link";

import { HeroSlideProps } from "./slider-types";

export const HeroSlide: FC<HeroSlideProps> = ({ slide }) => {
  return (
    <div className="flex items-center h-full w-full">
      <div className="w-full flex flex-col justify-between h-3/5 text-white ">
        {/* <h2 className={`text-center sm:text-left ${slide.title.styles}`}>
          {slide.title.text}
        </h2> */}
        <div className="flex flex-col text-6xl">
          <h2 className="">Zeitgeist</h2>
          <h2 className="mb-4">is Moving to Polkadot</h2>
          <h4 className="text-3xl font-bold">Learn More</h4>
        </div>
        {/* <p className={slide.title?.stylesSecondary}>{slide.title?.secondary}</p> */}
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
