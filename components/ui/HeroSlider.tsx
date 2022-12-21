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

  return (
    <section className="w-full h-[527px] mx-auto">
      <div className="h-full relative">
        <div
          className="bg-cover bg-center h-full w-full"
          style={{ backgroundImage: `url(${slides[currentSlide].bg})` }}
        ></div>
        <div className="flex absolute bottom-[15%] right-[10%]">
          <button
            className={`bg-black flex items-center justify-center w-[40px] h-[40px] rounded-full ztg-transition`}
          >
            <ChevronLeft className="text-white relative right-[1px]" />
          </button>
          <span className="text-white">. . . .</span>
          <button
            className={`bg-black flex items-center justify-center w-[40px] h-[40px] rounded-full ztg-transition`}
          >
            <ChevronRight className="text-white relative left-[1px]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
