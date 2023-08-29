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
        className="flex flex-col sm:flex-row py-6 sm:py-0 items-center w-full bg-white sm:h-[80px] md:h-[120px] px-6 md:px-[41px] overflow-hidden relative rounded-md"
      >
        <div className="font-medium text-2xl md:text-3xl lg:text-3xl flex-1 z-10 flex mb-6 sm:mb-0">
          {text.split("").map((c) => (
            <span key={c} className="block animate-[pop-in_0.08s_40ms]">
              {c == " " ? "\u00A0" : c}
            </span>
          ))}
        </div>
        <div className="relative">
          <a
            className={`flex relative cursor-wait center gap-2 ml-auto opacity-70 bg-[#DC056C] text-white rounded-md px-[20px] py-[10px] z-10 ${
              animationState === "finished" && "animate-pop-in"
            }`}
          >
            <span className="text-sm md:text-[px] font-semibold">
              Watch how
            </span>
            <Video size={24} />
          </a>
          <div className="absolute text-xs top-0 right-0 z-10 translate-x-[10%] -translate-y-[50%] text-white bg-blue-300 rounded-full py-1 px-2">
            Coming soon!
          </div>
        </div>
        <motion.div
          className="absolute left-[10%] sm:left-[25%] top-12 sm:top-8 w-[40%] pb-[40%] h-[0] rounded-full blur-3xl"
          style={{ x: ax, y: ay, backgroundColor: "rgba(250,217,255, 1)" }}
        ></motion.div>
        <motion.div
          className="absolute left-[62%] sm:-top-96 w-[40%] pb-[40%] h-[0] rounded-full blur-3xl"
          style={{ x: bx, y: by, backgroundColor: "rgba(231,237,247, 0.8)" }}
        ></motion.div>
      </div>
    </div>
  );
};

export default WatchHow;
