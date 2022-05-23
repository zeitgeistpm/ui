import { motion } from "framer-motion";
import React, { FC } from "react";

const LabeledToggle: FC<{
  onChange: (side: "left" | "right") => void;
  side: "left" | "right";
  leftLabel: string;
  rightLabel: string;
  className?: string;
  disabled?: boolean;
}> = ({
  side,
  onChange,
  rightLabel,
  leftLabel,
  className = "",
  disabled = false,
}) => {
  const toggleSide = () => {
    if (disabled) {
      return;
    }
    onChange(side === "left" ? "right" : "left");
  };

  const classes = "flex h-ztg-27 items-center text-sky-600 " + className;
  const activeClass = "text-black dark:text-white";

  return (
    <div className={classes}>
      <div
        className={`text-ztg-14-150 mr-ztg-10 font-lato ${
          !disabled && side === "left" ? activeClass : ""
        } ${disabled ? "text-sky-600" : ""}`}
      >
        {leftLabel}
      </div>
      <div
        className={`h-ztg-17 rounded-full w-ztg-64 items-center mr-ztg-10
          flex px-ztg-5 bg-white dark:bg-black ${
            disabled ? "cursor-default" : "cursor-pointer"
          }`}
        onClick={() => {
          toggleSide();
        }}
      >
        <motion.div
          layout
          className={`w-ztg-10 h-ztg-10 px-ztg-5 rounded-full
            ${side === "left" ? "mr-auto" : "ml-auto"} ${
            disabled ? "bg-sky-600" : "bg-black dark:bg-white"
          }`}
        ></motion.div>
      </div>
      <div
        className={`text-ztg-14-150 font-lato ${
          !disabled && side === "right" ? activeClass : ""
        } ${disabled ? "text-sky-600" : ""}`}
      >
        {rightLabel}
      </div>
    </div>
  );
};

export default LabeledToggle;
