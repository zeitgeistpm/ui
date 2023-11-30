import { motion, useAnimate } from "framer-motion";
import { TAILWIND } from "lib/constants";
import { RefObject, useEffect, useRef, useState } from "react";

export const TypingIndicator = ({
  inputRef,
  isFetching,
}: {
  inputRef: RefObject<HTMLInputElement>;
  isFetching: boolean;
}) => {
  const [index, setIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [scope, animate] = useAnimate();

  const typingTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const listener = () => {
      setIndex((prev) => {
        if (prev + 1 >= 3) {
          return 0;
        }
        return prev + 1;
      });
      setIsTyping(() => true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        setIsTyping(() => false);
      }, 1000);
    };
    inputRef.current?.addEventListener("keydown", listener);
    return () => {
      inputRef.current?.removeEventListener("keydown", listener);
    };
  }, [inputRef]);

  const typingAnimation = async () => {
    animate(
      "div",
      { transform: "translateY(0%)", opacity: 0.2 },
      { duration: 0.1 },
    );

    await animate(
      `div:nth-child(${index + 1})`,
      {
        transform: "translateY(-80%)",
        opacity: 0.5,
      },
      { duration: 0.1 },
    );

    await animate(
      `div:nth-child(${index + 1})`,
      {
        transform: "translateY(0%)",
        opacity: 0.2,
      },
      { duration: 0.1 },
    );
  };

  const loadingAnimationRef = useRef<Promise<void> | null>(null);

  const loadingAnimation = async () => {
    animate("div:nth-child(1)", { opacity: 0 }, { duration: 0.1 });
    animate("div:nth-child(3)", { opacity: 0 }, { duration: 0.1 });

    await animate(
      "div:nth-child(2)",
      {
        opacity: 1,
        transform: "scale(2.7)",
        backgroundColor: TAILWIND.theme.colors["blue"][500],
      },
      { duration: 0.6 },
    );
    await animate(
      "div:nth-child(2)",
      {
        transform: "scale(1)",
        opacity: 0.2,
        backgroundColor: TAILWIND.theme.colors["white"],
      },
      { duration: 0.3 },
    );
  };

  useEffect(() => {
    if (isFetching) {
      loadingAnimationRef.current = loadingAnimation();
    } else {
      if (loadingAnimationRef.current) {
        loadingAnimationRef.current.then(() => {
          typingAnimation();
        });
      } else {
        typingAnimation();
      }
    }
  }, [index, isFetching]);

  return (
    <div
      ref={scope}
      className={`flex items-center justify-center gap-1 transition-opacity ${
        isTyping ? "opacity-100" : "opacity-0"
      }`}
    >
      <motion.div className="h-1 w-1 rounded-full bg-white"></motion.div>
      <motion.div className="h-1 w-1 rounded-full bg-white"></motion.div>
      <motion.div className="h-1 w-1 rounded-full bg-white"></motion.div>
    </div>
  );
};
