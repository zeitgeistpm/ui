import { useEffect, useState } from "react";
import { HeroControls } from "./HeroControls";
import { HeroSlide } from "./HeroSlide";
import styles from "./HeroSlider.module.css";
import Image from "next/image";

import { moveSlider } from "./slider-controls";
import { Banner } from "lib/cms/get-banners";
import { IGetPlaiceholderReturn } from "plaiceholder";

const HeroSlider = ({
  banners,
  bannerPlaceHolders,
}: {
  banners: Banner[];
  bannerPlaceHolders: string[];
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [animate, setAnimate] = useState<boolean>(false);
  const slidesLength = banners.length;

  // autoplay
  useEffect(() => {
    if (banners.length > 1) {
      const ref = setTimeout(() => {
        setAnimate(true);
        moveSlider("next", currentSlide, setCurrentSlide, slidesLength);
      }, 10000);
      return () => {
        clearTimeout(ref);
      };
    }
  }, [currentSlide]);

  return (
    <section
      className={`relative w-full h-[527px] mx-auto ${
        animate && styles.fadeIn
      }`}
      onAnimationEnd={() => setAnimate(false)}
    >
      <Image
        src={banners[currentSlide].imageUrl}
        alt={`Image depicting ${banners[currentSlide].title}`}
        placeholder="blur"
        blurDataURL={bannerPlaceHolders[currentSlide]}
        sizes="100vw"
        fill
        style={{
          objectFit: "cover",
          objectPosition: `${banners[currentSlide].imageAlignment} 50%`,
        }}
      />
      <div className="h-full relative container-fluid">
        <HeroSlide
          banner={banners[currentSlide]}
          animate={animate}
          setAnimate={setAnimate}
        />
        {banners.length > 1 && (
          <HeroControls
            slides={banners}
            slidesLength={slidesLength}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            setAnimate={setAnimate}
          />
        )}
      </div>
    </section>
  );
};
export default HeroSlider;
