export const moveSlider = (
  direction: "prev" | "next" | "goto",
  currentSlide: number,
  setCurrentSlide: (a: number) => void,
  slidesLength: number,
  index?: number,
) => {
  if (direction === "prev") {
    const isFirstSlide = currentSlide === slidesLength - 1;
    const newSlide = isFirstSlide ? 0 : currentSlide + 1;
    setCurrentSlide(newSlide);
  }
  if (direction === "next") {
    const isFirstSlide = currentSlide === 0;
    const newSlide = isFirstSlide ? slidesLength - 1 : currentSlide - 1;
    setCurrentSlide(newSlide);
  }
  if (direction === "goto") {
    setCurrentSlide(index);
  }
  return;
};
