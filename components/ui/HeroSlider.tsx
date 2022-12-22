import React, { FC, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";

export interface HeroSliderProps {}

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

const HeroSlider: FC<HeroSliderProps> = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentSlide === 0;
    const newSlide = isFirstSlide ? slides.length - 1 : currentSlide - 1;
    setCurrentSlide(newSlide);
  };

  const goToNext = () => {
    const isFirstSlide = currentSlide === slides.length - 1;
    const newSlide = isFirstSlide ? 0 : currentSlide + 1;
    setCurrentSlide(newSlide);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="w-full h-[527px] mx-auto">
      <div className="h-full relative">
        <div
          className="bg-cover bg-center h-full w-full p-10"
          style={{ backgroundImage: `url(${slides[currentSlide].bg})` }}
        >
          <div className="max-w-[540px] pb-8">
            <h2
              style={{
                color: `${slides[currentSlide].title.color}`,
                fontSize: `${slides[currentSlide].title.size}`,
              }}
              className="font-kanit mb-6 leading-tight"
            >
              {slides[currentSlide].title.text}
            </h2>
            <div className="flex flex-col md:flex-row">
              <a
                style={{
                  borderColor: `${slides[currentSlide].color1.border}`,
                  backgroundColor: `${slides[currentSlide].color1.primary}`,
                  color: `${slides[currentSlide].color1.secondary}`,
                }}
                className="w-fit border rounded py-2 px-5 mb-5 mr-5 font-bold"
                href={slides[currentSlide].link1}
                target="_blank"
              >
                {slides[currentSlide].cta1}
              </a>
              {slides[currentSlide].cta2 && (
                <a
                  style={{
                    borderColor: `${slides[currentSlide].color2.border}`,
                    backgroundColor: `${slides[currentSlide].color2.primary}`,
                    color: `${slides[currentSlide].color2.secondary}`,
                  }}
                  className="w-fit border rounded py-2 px-3 mb-5 mr-5 font-bold"
                  href={slides[currentSlide].link2}
                  target="_blank"
                >
                  {slides[currentSlide].cta2}
                </a>
              )}
            </div>
          </div>
          ;
        </div>
        <div className="flex items-center justify-center md:justify-end w-full mx-auto gap-1 p-10 absolute bottom-0">
          <button
            onClick={goToPrevious}
            className={`bg-black border border-white flex items-center justify-center w-[40px] h-[40px] rounded-full`}
          >
            <ChevronLeft className="text-white relative right-[1px]" />
          </button>
          <div className="text-white">
            {slides.map((slide, index) => (
              <span
                onClick={() => goToSlide(index)}
                className={`cursor-pointer text-[48px] px-1 ${
                  index === currentSlide ? "text-white" : "opacity-50"
                }`}
                key={index}
              >
                &middot;
              </span>
            ))}
          </div>
          <button
            onClick={goToNext}
            className={`bg-black border border-white flex items-center justify-center w-[40px] h-[40px] rounded-full ztg-transition`}
          >
            <ChevronRight className="text-white relative left-[1px]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
