import { useMotionValue } from "framer-motion";
import { MutableRefObject, RefObject, useEffect } from "react";

export const useRelativeMousePosition = (ref: RefObject<HTMLDivElement>) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      x.updateAndNotify(
        ev.clientX -
          (ref.current?.clientWidth ?? 0) / 2 +
          (ref.current?.clientLeft ?? 0),
      );
      y.updateAndNotify(
        ev.clientY -
          (ref.current?.clientHeight ?? 0) / 2 +
          (ref.current?.clientTop ?? 0),
      );
    };

    window.addEventListener("mousemove", updateMousePosition);

    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return { x, y };
};
