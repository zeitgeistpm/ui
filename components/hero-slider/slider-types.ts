import { Banner } from "lib/cms/get-banners";

interface Title {
  text: string;
  secondary?: string;
  styles: string;
  stylesSecondary?: string;
}
interface Color {
  primary: string;
  secondary: string;
  border: string;
}

type Animate = (val: boolean) => void;
export interface Slides {
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
  banner: Banner;
  animate: boolean;
  setAnimate: Animate;
}
export interface HeroControlsProps {
  slides: Banner[];
  slidesLength: number;
  currentSlide: number;
  setCurrentSlide: (val: number) => void;
  setAnimate: Animate;
}
