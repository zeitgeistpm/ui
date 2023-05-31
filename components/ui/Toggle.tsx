import { motion, Variants } from "framer-motion";
import React, { FC } from "react";

export interface ToggleProps {
  active: boolean;
  onChange?: (active: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Toggle: FC<ToggleProps> = ({
  active,
  onChange,
  className = "",
  disabled = false,
}) => {
  const classes =
    "h-ztg-40 bg-sky-300 dark:bg-sky-700  font-bold text-sky-600 uppercase flex items-center justify-between rounded-full px-ztg-8 w-ztg-100 " +
    `${disabled ? "cursor-default" : "cursor-pointer"} ` +
    className;
  const activeClasses = "text-black dark:text-white";
  const variants: Variants = {
    left: { x: 6 },
    right: { x: 60 },
  };
  return (
    <div className="relative">
      <div
        className={classes}
        onClick={() => !disabled && onChange && onChange(!active)}
      >
        {["on", "off"].map((label, idx) => {
          const isActive =
            !disabled &&
            ((active && label === "on") || (!active && label === "off"));
          return (
            <div
              style={{ zIndex: 10 }}
              className={`w-ztg-30 h-ztg-30 flex-shrink-0 flex-grow-0 text-ztg-10-150 center ${
                isActive ? activeClasses : ""
              }`}
              data-test="liquidityButton"
              key={`toggle${idx}`}
            >
              {label}
            </div>
          );
        })}
      </div>
      <motion.div
        variants={variants}
        animate={active ? "left" : "right"}
        className="rounded-full w-ztg-34 h-ztg-34 cursor-pointer relative bottom-ztg-37 bg-white dark:bg-black"
      ></motion.div>
    </div>
  );
};

export default Toggle;
