import { useTypedText } from "lib/hooks/useTypedText";
import { useEffect, useRef, useState } from "react";
import { Video } from "react-feather";
import { useInView } from "react-intersection-observer";

const WatchHow = () => {
  const { text, play, animationState } = useTypedText(
    "Trade on any future event",
  );

  const { ref, inView } = useInView({ delay: 60 });

  useEffect(() => {
    if (inView && animationState === "waiting") {
      play();
    }
  }, [inView, animationState]);

  return (
    <div
      ref={ref}
      className="flex items-center w-full bg-white h-[80px] md:h-[120px] px-3 md:px-[41px] overflow-hidden relative rounded-md"
    >
      <div className="font-medium text-sm sm:text-lg md:text-[32px]  z-10">
        {text}
      </div>
      <a
        className={`flex cursor-pointer center gap-2 ml-auto bg-[#DC056C] text-white rounded-md px-[20px] py-[10px] z-10 ${
          animationState === "finished" && "animate-pop-in"
        }`}
      >
        <span className="text-sm md:text-[px] font-semibold">Watch how</span>
        <Video size={24} />
      </a>
      <div
        className="absolute left-[25%] top-10 w-[30%] pb-[30%] h-[0] rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(250,217,255, 1)" }}
      ></div>
      <div
        className="absolute left-[62%] -top-96 w-[40%] pb-[40%] h-[0] rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(231,237,247, 0.8)" }}
      ></div>
    </div>
  );
};

export default WatchHow;
