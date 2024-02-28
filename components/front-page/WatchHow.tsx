import { useScroll, useSpring, useTransform, motion } from "framer-motion";
import { useParallax } from "lib/hooks/animation/useParallax";
import { useTypedText } from "lib/hooks/animation/useTypedText";
import { useRelativeMousePosition } from "lib/hooks/events/useRelativeMousePosition";
import { useEffect, useRef, useState } from "react";
import { Video } from "react-feather";
import { useInView } from "react-intersection-observer";

const WatchHow = () => {
  const { text, play, animationState } = useTypedText(
    "Trade on any future event",
  );

  const { ref, inView } = useInView({ delay: 60 });

  const { scrollYProgress } = useScroll();
  const mouseRef = useRef<HTMLDivElement>(null);
  const { x: mx, y: my } = useRelativeMousePosition(mouseRef);

  const ay = useTransform(
    useSpring(my, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    [-1400, 1400],
    [-120, 75],
  );

  const ax = useTransform(
    useSpring(mx, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    [-1400, 1400],
    [-100, 100],
  );

  const by = useTransform(
    useSpring(my, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    [-1400, 1400],
    [-120, 120],
  );

  const bx = useTransform(
    useSpring(mx, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    }),
    [-1400, 1400],
    [-100, 100],
  );

  useEffect(() => {
    if (inView && animationState === "waiting") {
      play();
    }
  }, [inView, animationState]);

  return (
    <div ref={mouseRef}>
      <div
        ref={ref}
        className="relative flex w-full flex-col items-center overflow-hidden rounded-md bg-white px-6 py-6 sm:h-[80px] sm:flex-row sm:py-0 md:h-[120px] md:px-[41px]"
      >
        <div className="z-10 mb-6 flex flex-1 text-2xl font-medium sm:mb-0 md:text-3xl lg:text-3xl">
          {text.split("").map((c, index) => (
            <span key={index} className="block animate-[pop-in_0.08s_40ms]">
              {c == " " ? "\u00A0" : c}
            </span>
          ))}
        </div>
        <a
          href="https://www.youtube.com/playlist?list=PLdOlgpqyU8RP-ZK2A2qbcfxOlzoeuR6sx"
          target="_blank"
          rel="noreferrer"
          className={`center relative z-10 ml-auto flex cursor-pointer gap-2 rounded-md bg-ztg-pink px-[20px] py-[10px] text-white opacity-70 ${
            animationState === "finished" && "animate-pop-in"
          }`}
        >
          <span className="text-sm font-semibold md:text-[px]">Watch how</span>
          <Video size={24} />
        </a>
        <motion.div
          className="absolute left-[10%] top-12 h-[0] w-[40%] rounded-full pb-[40%] blur-3xl sm:left-[25%] sm:top-8"
          style={{ x: ax, y: ay, backgroundColor: "rgba(250,217,255, 1)" }}
        ></motion.div>
        <motion.div
          className="absolute left-[62%] h-[0] w-[40%] rounded-full pb-[40%] blur-3xl sm:-top-96"
          style={{ x: bx, y: by, backgroundColor: "rgba(231,237,247, 0.8)" }}
        ></motion.div>
      </div>
    </div>
  );
};

export default WatchHow;
