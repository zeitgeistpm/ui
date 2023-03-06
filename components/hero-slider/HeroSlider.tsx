import { FC, useEffect, useState } from "react";
import { HeroControls } from "./HeroControls";
import { HeroSlide } from "./HeroSlide";
import { slidesData } from "./slides-data";
import styles from "./HeroSlider.module.css";
import Image from "next/image";
import { IGetPlaiceholderReturn } from "plaiceholder";

import { moveSlider } from "./slider-controls";
import { Banner } from "lib/cms/get-banners";

const HeroSlider = ({
  banners,
  imagePlaceholders,
}: {
  banners: Banner[];
  imagePlaceholders: IGetPlaiceholderReturn[];
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
        blurDataURL={imagePlaceholders[currentSlide].base64}
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
        {slidesData.length > 1 && (
          <HeroControls
            slides={slidesData}
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
