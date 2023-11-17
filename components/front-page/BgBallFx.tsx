import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useParallax } from "lib/hooks/animation/useParallax";
import { useRelativeMousePosition } from "lib/hooks/events/useRelativeMousePosition";
import { useRef } from "react";

export const BgBallGfx = () => {
  const { scrollYProgress } = useScroll();
  const ref = useRef<HTMLDivElement>(null);
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
      ref={ref}
      className="absolute -left-24 -top-[170px] z-0 hidden h-[860px] w-[860px] rotate-180 items-center justify-center rounded-full bg-red md:flex"
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
