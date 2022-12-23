import { FC } from "react";

export interface HeroSlideProps {
  slides: [];
  currentSlide: number;
  animate: 0 | 1;
  setAnimate: (a: 0 | 1) => void;
}

export const HeroSlide: FC<HeroSlideProps> = ({
  slides,
  currentSlide,
  animate,
  setAnimate,
}) => {
  const slide = slides[currentSlide];
  return (
    <div
      className="flex items-center bg-cover bg-center h-full w-full p-5 md:p-10 fade-in-image"
      style={{ backgroundImage: `url(${slide.bg})` }}
      onAnimationEnd={() => setAnimate(0)}
      data-animate={animate}
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
      ;
    </div>
  );
};
