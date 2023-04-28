import Image from "next/image";
import { useEffect, useState } from "react";
import { HeroControls } from "./HeroControls";
import { HeroSlide } from "./HeroSlide";
import styles from "./HeroSlider.module.css";
import { Banner } from "lib/cms/get-banners";
import { useSliderControls } from "lib/hooks/slides";
import { usePrevious } from "lib/hooks/usePrevious";
import { isNumber } from "lodash-es";
import { Transition } from "@headlessui/react";

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
      className={`relative w-full h-[527px] mx-auto`}
      data-testid="HeroSlider__container"
    >
      {banners.map((banner, index) => (
        <Image
          key={index}
          priority
          src={banner.imageUrl}
          alt={`Image depicting ${banner.title}`}
          placeholder="blur"
          blurDataURL={bannerPlaceHolders[index]}
          sizes="100vw"
          fill
          className={`absolute inset-0 w-full h-full transition-opacity`}
          style={{
            objectFit: "cover",
            transitionDuration: index == slider.currentSlide ? "0.5s" : "1s",
            opacity: index == slider.currentSlide ? "1" : "0.001",
            objectPosition: `${banner.imageAlignment} 50%`,
          }}
        />
      ))}
      <div className="h-full relative container-fluid">
        {banners.map((banner, index) => (
          <Transition
            className={"absolute h-full w-full"}
            show={index == slider.currentSlide}
            enter="transition-all duration-500"
            enterFrom="opacity-0 blur"
            enterTo="opacity-100 blur-none"
            leave="transition-all duration-1000"
            leaveFrom="opacity-100 blur-none"
            leaveTo="opacity-0 blur"
          >
            <HeroSlide className="absolute h-full w-full" banner={banner} />
          </Transition>
        ))}
        {banners.length > 1 && (
          <HeroControls slides={banners} slider={slider} />
        )}
      </div>
    </section>
  );
};
export default HeroSlider;
