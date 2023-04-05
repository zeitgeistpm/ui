import Image from "next/image";
import { useEffect, useState } from "react";
import { HeroControls } from "./HeroControls";
import { HeroSlide } from "./HeroSlide";
import styles from "./HeroSlider.module.css";
import { Banner } from "lib/cms/get-banners";
import { useSliderControls } from "lib/hooks/slides";
import { usePrevious } from "lib/hooks/usePrevious";
import { isNumber } from "lodash-es";

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

  const [animate, setAnimate] = useState<boolean>(false);

  const prevSlide = usePrevious(slider.currentSlide);

  useEffect(() => {
    if (isNumber(prevSlide) && prevSlide !== slider.currentSlide) {
      setAnimate(true);
    }
  }, [slider.currentSlide]);

  return (
    <section
      className={`relative w-full h-[527px] mx-auto ${
        animate && styles.fadeIn
      }`}
      onAnimationEnd={() => setAnimate(false)}
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
          style={{
            display: index === slider.currentSlide ? "block" : "none",
            objectFit: "cover",
            objectPosition: `${banner.imageAlignment} 50%`,
          }}
        />
      ))}
      <div className="h-full relative container-fluid">
        <HeroSlide banner={banners[slider.currentSlide]} />
        {banners.length > 1 && (
          <HeroControls slides={banners} slider={slider} />
        )}
      </div>
    </section>
  );
};
export default HeroSlider;
