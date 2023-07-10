import Image from "next/image";
import { HeroControls } from "./HeroControls";
import { HeroSlide } from "./HeroSlide";
import { Banner } from "lib/cms/get-banners";
import { useSliderControls } from "lib/hooks/slides";
import { Transition } from "@headlessui/react";
import { isCurrentOrigin } from "lib/util/is-current-origin";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

const HeroSlider = ({
  banners,
  bannerPlaceHolders,
}: {
  banners: Banner[];
  bannerPlaceHolders: string[];
}) => {
  const slider = useSliderControls({
    count: banners.length,
    autoplay: 15 * 1000,
    pauseOnUserInteraction: 45 * 1000,
  });

  return (
    <section
      className={`relative w-full h-[527px] mx-auto `}
      data-testid="HeroSlider__container"
    >
      {banners.map((banner, index) => (
        <Image
          key={index}
          priority
          src={banner.imageUrl ?? ""}
          alt={`Image depicting ${banner.title}`}
          placeholder="blur"
          blurDataURL={bannerPlaceHolders[index]}
          sizes="100vw"
          fill
          className={`absolute inset-0 w-full h-full transition-opacity`}
          style={{
            objectFit: "cover",
            transitionDuration: index == slider.currentSlide ? "0.5s" : "1s",
            opacity: index == slider.currentSlide ? "1" : "0.0001",
            objectPosition: `${banner.imageAlignment} 50%`,
          }}
        />
      ))}

      <div className="h-full relative container-fluid">
        <div className="absolute left-0 md:left-auto h-full w-full flex items-center">
          <div className="md:bg-black md:bg-opacity-60 rounded-lg h-80 w-full md:w-4/6 relative md:px-8">
            {banners.map((banner, index) => {
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

              const isActive = index == slider.currentSlide;

              return (
                <div
                  key={index}
                  className="absolute h-full w-full flex items-center px-4 md:px-8"
                >
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
                </div>
              );
            })}

            <div className="absolute md:h-full -bottom-8 md:bottom-0 w-full md:w-auto md:right-8 flex items-center justify-center md:items-end">
              <HeroControls slides={banners} slider={slider} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
