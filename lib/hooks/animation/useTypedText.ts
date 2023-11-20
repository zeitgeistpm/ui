import { random } from "lodash-es";
import { useEffect, useRef, useState } from "react";

export const useTypedText = (fullText: string) => {
  const chars = useRef(fullText.split(""));
  const [text, setStext] = useState("");

  const [animationState, setAnimationState] = useState<
    "waiting" | "playing" | "finished"
  >("waiting");

  useEffect(() => {
    if (animationState === "playing") {
      setTimeout(
        () => {
          if (chars.current.length > 0) {
            setStext(text + chars.current.shift());
          } else {
            setAnimationState("finished");
          }
        },
        random(15, 55),
      );
    }
  }, [animationState, text]);

  const play = () => {
    setAnimationState("playing");
  };

  return {
    text,
    animationState,
    play,
  };
};
