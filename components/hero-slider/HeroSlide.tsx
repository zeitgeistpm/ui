import { CSSProperties, FC, useMemo } from "react";
import Link from "next/link";
import { News } from "lib/cms/get-news";
import { isCurrentOrigin } from "lib/util/is-current-origin";

export interface HeroSlideProps {
  className?: string;
  style?: CSSProperties;
  banner: News;
}

export const HeroSlide: FC<HeroSlideProps> = ({ banner, style, className }) => {
  const isExternalLink = banner.ctaLink
    ? !isCurrentOrigin(banner.ctaLink)
    : false;
  const linkProps = {
    style: {
      backgroundColor: `${banner.buttonColor}`,
      borderColor: `${banner.buttonColor}`,
      color: banner.buttonTextColor,
    },
    className:
      "leading-[42px] w-full sm:w-fit text-center sm:text-start border rounded px-5 mb-5 mr-5 font-bold",
    href: banner.ctaLink,
  };

  return (
    <div
      className={`flex items-center h-full w-full ${className}`}
      style={style}
    >
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
          {isExternalLink ? (
            <a {...linkProps} target="_blank">
              {banner.ctaText}
            </a>
          ) : (
            <>
              {linkProps.href && (
                <Link
                  href={linkProps.href}
                  className={linkProps.className}
                  style={linkProps.style}
                >
                  {banner.ctaText}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
