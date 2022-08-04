import React, { FC, useState } from "react";
import { motion } from "framer-motion";

const GlitchImage: FC<{ className?: string; alt?: string; src: string }> = ({
  className,
  src,
}) => {
  const [isGlitching, setIsGlitching] = useState(false);

  const bg: React.CSSProperties = {
    backgroundImage: `url(${src})`,
    backgroundSize: "cover",
  };

  const container: React.CSSProperties = {
    overflow: "hidden",
    position: "relative",
  };

  const img: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundBlendMode: "none",
    backgroundColor: "transparent",
    pointerEvents: "none",
    transform: "translate3d(0, 0, 0)",
  };

  const anim: React.CSSProperties = {
    animationDuration: "2s",
    animationDelay: "0",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    animationFillMode: "forwards",
  };

  return (
    <div
      className={className}
      style={{ ...container, ...bg }}
      onMouseOver={() => setIsGlitching(true)}
      onMouseOut={() => setIsGlitching(false)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isGlitching ? 1 : 0 }}
      >
        <div style={{ ...bg, ...img }} />
        <div
          style={{ ...bg, ...img, ...anim, animationName: "glitch-anim-1" }}
        />
        <div
          style={{ ...bg, ...img, ...anim, animationName: "glitch-anim-2" }}
        />
        <div
          style={{ ...bg, ...img, ...anim, animationName: "glitch-anim-3" }}
        />
        <div
          style={{
            ...bg,
            ...img,
            ...anim,
            animationName: "glitch-anim-4",
            backgroundBlendMode: "overlay",
            backgroundColor: "#af4949",
          }}
        />
      </motion.div>
    </div>
  );
};

export default GlitchImage;
