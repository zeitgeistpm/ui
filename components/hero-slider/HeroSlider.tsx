import { FC, useEffect, useState } from "react";
import { HeroControls } from "./HeroControls";
import { HeroSlide } from "./HeroSlide";
import { slidesData } from "./slides-data";
import styles from "./HeroSlider.module.css";

//hero controls
import { moveSlider } from "./slider-controls";

export interface HeroSliderProps {}

const HeroSlider: FC<HeroSliderProps> = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [animate, setAnimate] = useState<boolean>(false);
  const slidesLength = slidesData.length;

  //autoplay
  useEffect(() => {
    const ref = setTimeout(() => {
      setAnimate(true);
      moveSlider("next", currentSlide, setCurrentSlide, slidesLength);
    }, 5000);
    return () => {
      clearTimeout(ref);
    };
  }, [currentSlide]);

  return (
    <section
      className={`w-full h-[527px] mx-auto  bg-cover bg-center ${
        animate && styles.fadeIn
      }`}
      style={{ backgroundImage: `url(${slidesData[currentSlide].bg})` }}
      onAnimationEnd={() => setAnimate(false)}
    >
      <div className="h-full relative container-fluid">
        <HeroSlide
          slide={slidesData[currentSlide]}
          animate={animate}
          setAnimate={setAnimate}
        />
        <HeroControls
          slides={slidesData}
          slidesLength={slidesLength}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          setAnimate={setAnimate}
        />
      </div>
    </section>
  );
};

export default HeroSlider;
