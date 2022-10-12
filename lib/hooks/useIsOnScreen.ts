import { useEffect, useRef, useState } from "react";

export const useIsOnScreen = (ref: React.MutableRefObject<HTMLElement>) => {
  const [isIntersecting, setIntersecting] = useState(false);
  const observer = useRef<IntersectionObserver>();

  useEffect(() => {
    if (observer.current == null) {
      observer.current = new IntersectionObserver(([entry]) =>
        setIntersecting(entry.isIntersecting),
      );
    }
    observer.current.observe(ref.current);
    return () => {
      observer.current.disconnect();
    };
  }, []);

  return isIntersecting;
};
