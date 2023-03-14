import { FC } from "react";
import Link from "next/link";

import { HeroSlideProps } from "./slider-types";

export const HeroSlide: FC<HeroSlideProps> = ({ banner }) => {
  return (
    <div className="flex items-center h-full w-full">
      <div className="w-full pb-8">
        <h2
          className={`text-center sm:text-left text-white font-sans md:whitespace-pre font-extrabold text-5xl sm:text-7xl lg:text-8xl mb-4`}
        >
          {banner.title}
        </h2>
        <p
          className={
            "text-center sm:text-start text-white font-sans whitespace-pre font-extrabold text-3xl md:text-4xl mb-6"
          }
        >
          {banner.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row">
          <Link
            style={{
              backgroundColor: `${banner.buttonColor}`,
              borderColor: `${banner.buttonColor}`,
              color: banner.buttonTextColor,
            }}
            className="leading-[42px] w-full sm:w-fit text-center sm:text-start border rounded px-5 mb-5 mr-5 font-bold"
            href={banner.ctaLink}
          >
            {banner.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
};
