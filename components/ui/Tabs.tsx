import { FC, HTMLProps } from "react";
import { observer } from "mobx-react";
import { motion, Variants } from "framer-motion";

export interface TabsProps {
  labels: string[];
  active: number;
  onTabChange?: (index: number) => void;
}

const Tabs: FC<HTMLProps<HTMLDivElement> & TabsProps> = observer(
  ({ className = "", labels, active, onTabChange }) => {
    const classes = "flex w-full";
    const variants: Variants = {
      left: { x: 0 },
      right: { x: 152 },
    };
    return (
      <div className="flex flex-col">
        <div className={`${classes} ${className}`}>
          {labels.map((label, idx) => {
            const textColor =
              active === idx
                ? "text-black dark:text-white"
                : "text-border-light dark:text-border-dark";

            return (
              <div key={`drawerTab${idx}`} className={`w-full`}>
                <div
                  className={`text-ztg-14-150 font-bold h-ztg-40 center w-full cursor-pointer ${textColor}`}
                  onMouseDown={() => {
                    onTabChange && onTabChange(idx);
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mx-ztg-28">
          <motion.div
            variants={variants}
            animate={active === 0 ? "left" : "right"}
            transition={{
              type: "spring",
              stiffness: 500,
              bounce: 0.5,
              damping: 50,
            }}
            className="bg-black dark:bg-white w-1/2 h-1"
          ></motion.div>
        </div>
      </div>
    );
  },
);

export default Tabs;
