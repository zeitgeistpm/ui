import React, { FC, useEffect, useState } from "react";
import { CarouselProvider, Slider, Slide, Dot } from "pure-react-carousel";
import "pure-react-carousel/dist/react-carousel.es.css";
import GlitchImage from "./GlitchImage";

export interface CarouselProps {}

const Carousel: FC<CarouselProps> = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const ref = setTimeout(() => {
      setCurrentSlide(1);
    }, 5000);
    return () => {
      clearTimeout(ref);
    };
  }, []);
  return (
    <CarouselProvider
      naturalSlideWidth={760}
      naturalSlideHeight={274}
      totalSlides={2}
      currentSlide={currentSlide}
    >
      <Slider className="rounded-ztg-10">
        <Slide index={0} className="bg-black rounded-ztg-10">
          <GlitchImage
            glitchImageSrc="/carousel/beta-welcome-2.png"
            className="h-full rounded-ztg-10"
          />
        </Slide>
        <Slide index={1} className="bg-black rounded-ztg-10">
          <a href={`https://shapethefuture.zeitgeist.pm`} target="_blank">
            <GlitchImage
              glitchImageSrc="/carousel/shape-the-future.png"
              className="h-full rounded-ztg-10"
            />
          </a>
        </Slide>
      </Slider>
      <div className="w-2/3 relative bottom-3 ml-16%">
        <div className="flex flex-row item-center justify-center">
          <Dot slide={0} className="w-full bg-sky-600 h-1 mr-2" />
          <Dot slide={1} className="w-full bg-sky-600 h-1 mr-2" />
          {/* <Dot slide={2} className="w-full bg-sky-600 h-1 mr-2" /> */}
        </div>
      </div>
    </CarouselProvider>
  );
};

export default Carousel;
