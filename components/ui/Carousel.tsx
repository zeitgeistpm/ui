import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "react-feather";

type CarouselProps = {
  slides: Array<ReactNode>;
  options?: EmblaOptionsType;
};

const Carousel: React.FC<CarouselProps> = (props) => {
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-1">
        <button
          onClick={onPrevButtonClick}
          className={`ztg-transition ml-[12px] mr-[8px] flex h-[18px] w-[18px] items-center justify-center rounded-full ${
            prevBtnDisabled ? "text-pastel-blue opacity-30" : " text-gray-700"
          }`}
          disabled={prevBtnDisabled}
        >
          <ChevronLeft className="relative right-[1px]" />
        </button>
        <button
          onClick={onNextButtonClick}
          className={`ztg-transition flex h-[18px] w-[18px] items-center justify-center rounded-full ${
            nextBtnDisabled ? "text-pastel-blue opacity-30" : "text-gray-700"
          }`}
          disabled={nextBtnDisabled}
        >
          <ChevronRight className="relative left-[1px]" />
        </button>
      </div>

      <div className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            {slides.map((slide, index) => (
              <div className="embla__slide" key={index}>
                <div className="embla__slide__number">
                  <span>{slide}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

export const usePrevNextButtons = (
  emblaApi: EmblaCarouselType | undefined,
): UsePrevNextButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
};

export default Carousel;
