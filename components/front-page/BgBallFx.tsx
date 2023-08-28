import { useSpring } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { MotionValue, motion, useScroll, useTransform } from "framer-motion";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";

function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [0, distance]);
}

const useRelativeMousePosition = (
  ref: MutableRefObject<HTMLDivElement | undefined>,
) => {
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

export const BgBallGfx = () => {
  const { scrollYProgress } = useScroll();
  const ref = useRef();
  const { x: mx, y: my } = useRelativeMousePosition(ref);

  const osy = useParallax(
    useSpring(scrollYProgress, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    220,
  );

  const osx = useTransform(
    useSpring(mx, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    [-1400, 1400],
    [-50, 50],
  );

  const iy = useTransform(
    useSpring(my, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    [-1400, 1400],
    [-75, 75],
  );

  const ix = useTransform(
    useSpring(mx, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    [-1400, 1400],
    [-75, 75],
  );

  const omy = useTransform(
    useSpring(my, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    [-1400, 1400],
    [-50, 50],
  );

  const oy = useTransform(() => osy.get() + omy.get());

  return (
    <motion.div
      ref={ref as any}
      className="hidden absolute md:flex justify-center -left-24 -top-[170px] items-center h-[860px] w-[860px] rounded-full bg-red z-0 rotate-180"
      style={{
        y: oy,
        x: osx,
        background:
          "linear-gradient(131.15deg, rgb(0 102 255 / 7%) 11.02%, rgba(254, 0, 152, 0.1) 93.27%)",
      }}
    >
      <motion.div
        className="h-3/5 w-3/5 rounded-full"
        style={{
          y: iy,
          x: ix,
          background:
            "linear-gradient(131.15deg, rgb(0 102 255 / 5%) 11.02%, rgba(217, 14, 14, 0.1) 93.27%)",
        }}
      ></motion.div>
    </motion.div>
  );
};
