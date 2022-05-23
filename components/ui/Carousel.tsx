import React, { FC, useEffect, useState } from "react";
import { CarouselProvider, Slider, Slide, Dot } from "pure-react-carousel";
import "pure-react-carousel/dist/react-carousel.es.css";

export interface CarouselProps {}

const Carousel: FC<CarouselProps> = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  //TODO: make more dynamic once we have more details on what to display

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
          <img
            src="/carousel/beta-welcome-2.png"
            alt="Beta welcome"
            className="h-full rounded-ztg-10"
          />
        </Slide>
        <Slide index={1} className="bg-black rounded-ztg-10">
          <a href={`https://shapethefuture.zeitgeist.pm`} target="_blank">
            <img
              src="/carousel/shape-the-future.png"
              alt="Shape the future with Zeitgeist"
              className="h-full rounded-ztg-10"
            />
          </a>
        </Slide>
        {/* <Slide index={1} className="bg-red-500 rounded-ztg-10">
          <div className="flex flex-col">
            <div>Test</div>
            <div>Displaying</div>
            <div>Components</div>
            <Switch
              leftLabel="Buy"
              rightLabel="Sell"
              initialSelection="right"
              onLeftSideClick={() => {}}
              onRightSideClick={() => {}}
            />
          </div>
        </Slide>
        <Slide index={2} className="bg-black rounded-ztg-10">
          <div className="rounded-ztg-10">
            <img
              src="https://via.placeholder.com/240x127"
              alt="logo"
              className="w-full rounded-ztg-10"
            />
          </div>
        </Slide> */}
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
