import React, { FC, useEffect, useState } from "react";
import {
  CarouselProvider,
  Slider,
  Slide,
  Dot,
  DotGroup,
} from "pure-react-carousel";
import "pure-react-carousel/dist/react-carousel.es.css";

export interface CarouselProps {}

const slides = [
  {
    title: {
      text: `Introducing Zeitgeist Avatar`,
      size: `4rem`,
      color: `#FFF`,
    },
    bg: "/carousel/slide-1.jpeg",
    cta1: "Protocol Exclusive",
    link1: "https://blog.zeitgeist.pm/",
    color1: {
      primary: "#E90303",
      secondary: "#FFF",
      border: "#E90303",
    },
    cta2: "Read Post",
    link2: "https://blog.zeitgeist.pm/zeitgeist-newsletter-002/",
    color2: {
      primary: "transparent",
      secondary: "#FFF",
      border: "#FFF",
    },
  },
  {
    title: {
      text: `Exiled Racers`,
      size: `4rem`,
      color: `#FFF`,
    },
    bg: "/carousel/slide-2.jpeg",
    cta1: "New Markets",
    link1: "https://shapethefuture.zeitgeist.pm",
    color1: {
      primary: "#000",
      secondary: "#E90303",
      border: "#E90303",
    },
    cta2: "",
    link2: "https://shapethefuture.zeitgeist.pm",
    color2: {
      primary: "",
      secondary: "",
      border: "",
    },
  },
  {
    title: {
      text: `ZTG is now traded on DEXs`,
      size: `4rem`,
      color: `#FFF`,
    },
    bg: "/carousel/slide-3.jpeg",
    cta1: "Visit In-App Exchange",
    link1: "https://shapethefuture.zeitgeist.pm",
    color1: {
      primary: "#F7FF58",
      secondary: "#000",
      border: "#F7FF58",
    },
    cta2: "",
    link2: "https://shapethefuture.zeitgeist.pm",
    color2: {
      primary: "",
      secondary: "",
      border: "",
    },
  },
  {
    title: {
      text: `Presenting Zeitgeist’s 
      "Rikiddo Scoring Rule"`,
      size: `3rem`,
      color: `#FFF`,
    },
    bg: "/carousel/slide-4.jpeg",
    cta1: "New Markets",
    link1: "https://shapethefuture.zeitgeist.pm",
    color1: {
      primary: "#F7FF58",
      secondary: "#000",
      border: "#F7FF58",
    },
    cta2: "",
    link2: "https://shapethefuture.zeitgeist.pm",
    color2: {
      primary: "",
      secondary: "",
      border: "",
    },
  },
];

const Carousel: FC<CarouselProps> = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // useEffect(() => {
  //   const ref = setTimeout(() => {
  //     setCurrentSlide(1);
  //   }, 5000);
  //   return () => {
  //     clearTimeout(ref);
  //   };
  // }, []);

  //TODO: once ready; remove padding in innerClassName and match inner hero container with rest of page. remove rounded-ztg-10 from slider.

  return (
    <CarouselProvider
      naturalSlideWidth={1440}
      naturalSlideHeight={527}
      totalSlides={slides.length}
      currentSlide={currentSlide}
      infinite={true}
    >
      <Slider className="rounded-ztg-10">
        {slides.map((slide, index) => {
          return (
            <Slide
              index={index}
              style={{ backgroundImage: `url(${slide.bg})` }}
              className="w-full bg-cover p-5"
              innerClassName="max-w-ztg-1100 mx-auto flex flex-col justify-center p-5"
            >
              <div className="max-w-[540px] pb-8">
                <h2
                  style={{
                    color: `${slide.title.color}`,
                    fontSize: `${slide.title.size}`,
                  }}
                  className="font-kanit mb-6 leading-tight"
                >
                  {slide.title.text}
                </h2>
                <div className="flex flex-col md:flex-row">
                  <a
                    style={{
                      borderColor: `${slide.color1.border}`,
                      backgroundColor: `${slide.color1.primary}`,
                      color: `${slide.color1.secondary}`,
                    }}
                    className="w-fit border rounded py-2 px-5 mb-5 mr-5 font-bold"
                    href={slide.link1}
                    target="_blank"
                  >
                    {slide.cta1}
                  </a>
                  {slide.cta2 && (
                    <a
                      style={{
                        borderColor: `${slide.color2.border}`,
                        backgroundColor: `${slide.color2.primary}`,
                        color: `${slide.color2.secondary}`,
                      }}
                      className="w-fit border rounded py-2 px-3 mb-5 mr-5 font-bold"
                      href={slide.link2}
                      target="_blank"
                    >
                      {slide.cta2}
                    </a>
                  )}
                </div>
              </div>
            </Slide>
          );
        })}
      </Slider>
      <DotGroup />
      {/* <div className="w-2/3 relative bottom-3 ml-16%">
        <div className="flex flex-row item-center justify-center">
          <Dot slide={0} className="w-full bg-sky-600 h-1 mr-2" />
          <Dot slide={1} className="w-full bg-sky-600 h-1 mr-2" />
          <Dot slide={2} className="w-full bg-sky-600 h-1 mr-2" />
        </div>
      </div> */}
    </CarouselProvider>
  );
};

export default Carousel;
