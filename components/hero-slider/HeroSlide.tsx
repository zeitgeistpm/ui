import { CSSProperties, FC, useMemo } from "react";
import Link from "next/link";
import { Banner } from "lib/cms/get-banners";
import { isCurrentOrigin } from "lib/util/is-current-origin";
import { Transition } from "@headlessui/react";

export interface HeroSlideProps {
  banner: Banner;
  isActive: boolean;
}

export const HeroSlide: FC<HeroSlideProps> = ({ banner, isActive }) => {
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
    <div className={`${isActive ? "z-30" : "z-20"}`}>
      <Transition
        show={isActive}
        enter="transition-all duration-1000"
        enterFrom="opacity-0 blur-md"
        enterTo="opacity-100 blur-none"
        leave="transition-all duration-1000"
        leaveFrom="opacity-100 blur-none"
        leaveTo="opacity-0 blur-md"
      >
        <div>
          <h2
            className={`text-center sm:text-left text-white font-sans md:whitespace-pre font-bold text-4xl lg:text-5xl mb-6`}
          >
            {banner.title}
          </h2>
          <p
            className={
              "text-center sm:text-start text-white font-sans whitespace-pre font-bold text-lg md:text-xl mb-8"
            }
          >
            {banner.subtitle}
          </p>
        </div>
      </Transition>

      <Transition
        show={isActive}
        enter="transition-all duration-1000"
        enterFrom="opacity-0 blur-md"
        enterTo="opacity-100 blur-none"
        leave="transition-all duration-1000"
        leaveFrom="opacity-100 blur-none"
        leaveTo="opacity-0 blur-md"
        className="flex flex-col sm:flex-row"
      >
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
      </Transition>
    </div>
  );
};
