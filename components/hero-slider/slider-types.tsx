interface Title {
  text: string;
  size: string;
  color: string;
}

interface Color {
  primary: string;
  secondary: string;
  border: string;
}

export interface Slides {
  custom: boolean;
  id: number;
  title: Title;
  bg: string;
  cta1: string;
  link1: string;
  color1: Color;
  cta2: string;
  link2: string;
  color2: Color;
}

export interface HeroSlideProps {
  slides: Slides[];
  currentSlide: number;
  animate: number;
  setAnimate: (a: 0 | 1) => void;
}

export interface HeroControlsProps {
  slides: Slides[];
  slidesLength: number;
  currentSlide: number;
  setCurrentSlide: (val: number) => void;
  setAnimate: (val: number) => void;
}
