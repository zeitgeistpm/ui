import { useEffect } from "react";

export const useDisableScroll = (disable: boolean) => {
  useEffect(() => {
    if (disable) {
      const scrollPos = window.scrollY;
      const onScroll = () => {
        window.scrollTo(0, scrollPos);
      };
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, [disable]);
};
