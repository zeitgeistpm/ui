import { useTypedText } from "lib/hooks/useTypedText";
import { useEffect, useRef, useState } from "react";
import { Video } from "react-feather";
import { useInView } from "react-intersection-observer";

const WatchHow = () => {
  const { text, play, animationState } = useTypedText(
    "Trade on any future event.",
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
      className="flex items-center w-full bg-white h-[80px] md:h-[120px] px-6 md:px-[41px] overflow-hidden relative rounded-md"
    >
      <div className="font-medium text-xl lg:text-3xl flex-1 z-10 flex">
        {text.split("").map((c) => (
          <span key={c} className="block animate-[pop-in_0.1s]">
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
          <span className="text-sm md:text-[px] font-semibold">Watch how</span>
          <Video size={24} />
        </a>
        <div className="absolute text-xs top-0 right-0 z-10 translate-x-[10%] -translate-y-[50%] text-white bg-blue-300 rounded-full py-1 px-2">
          Coming soon!
        </div>
      </div>
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
