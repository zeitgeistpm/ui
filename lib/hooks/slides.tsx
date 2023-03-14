import { isNumber } from "lodash-es";
import { useEffect, useRef, useState } from "react";

export type UseSlidesProps = {
  count: number;
  autoplay?: number;
  currentSlide?: number;
  pauseOnUserInteraction?: number;
};

export type UseSliderControls = {
  currentSlide: number;
  next: (userOrigin?: boolean) => void;
  prev: (userOrigin?: boolean) => void;
  goto: (slide: number, userOrigin?: boolean) => void;
};

export const useSliderControls = (props: UseSlidesProps): UseSliderControls => {
  const [currentSlide, setCurrentSlide] = useState<number>(
    props.currentSlide ?? 0,
  );

  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [paused, setPaused] = useState(false);

  const prev = (userOrigin?: boolean) => {
    const isFirstSlide = currentSlide === props.count - 1;
    const newSlide = isFirstSlide ? 0 : currentSlide + 1;
    setCurrentSlide(newSlide);
    userOrigin && pause();
  };

  const next = (userOrigin?: boolean) => {
    const isFirstSlide = currentSlide === 0;
    const newSlide = isFirstSlide ? props.count - 1 : currentSlide - 1;
    setCurrentSlide(newSlide);
    userOrigin && pause();
  };

  const goto = (slide: number, userOrigin?: boolean) => {
    setCurrentSlide(slide);
    userOrigin && pause();
  };

  const pause = () => {
    clearTimeout(timerRef.current);
    setPaused(true);
    clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setPaused(false);
    }, props.pauseOnUserInteraction);
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (paused) return;

    if (!isNumber(props.autoplay) && timerRef.current) {
      clearTimeout(timerRef.current);
    } else if (isNumber(props.autoplay) && props.count > 1) {
      timerRef.current = setTimeout(() => {
        next();
      }, props.autoplay);
      return () => {
        clearTimeout(timerRef.current);
      };
    }
  }, [props.autoplay, currentSlide, paused]);

  return {
    currentSlide,
    next,
    prev,
    goto,
  };
};
