import Image from "next/image";
import { HeroControls } from "./HeroControls";
import { HeroSlide } from "./HeroSlide";
import { CmsNews } from "lib/cms/news";
import { useSliderControls } from "lib/hooks/slides";
import { Transition } from "@headlessui/react";

const HeroSlider = ({
  banners,
  bannerPlaceHolders,
}: {
  banners: CmsNews[];
  bannerPlaceHolders: string[];
}) => {
  const slider = useSliderControls({
    count: banners.length,
    autoplay: 15 * 1000,
    pauseOnUserInteraction: 45 * 1000,
  });

  return (
    <section
      className={`relative mx-auto h-[527px] w-full`}
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
          className="object-cover"
          style={{
            objectFit: "cover",
            transitionDuration: index == slider.currentSlide ? "0.5s" : "1s",
            opacity: index == slider.currentSlide ? "1" : "0.001",
            objectPosition: `${banner.imageAlignment} 50%`,
          }}
        />
      ))}
      <div className="container-fluid relative h-full">
        {banners.map((banner, index) => (
          <Transition
            className="container-fluid absolute left-0 h-full w-full"
            show={index == slider.currentSlide}
            enter="transition-all duration-1000"
            enterFrom="opacity-0 blur-md"
            enterTo="opacity-100 blur-none"
            leave="transition-all duration-1000"
            leaveFrom="opacity-100 blur-none"
            leaveTo="opacity-0 blur-md"
            key={index}
          >
            <HeroSlide banner={banner} />
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
