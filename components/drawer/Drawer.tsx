import { observer } from "mobx-react";
import { ArrowLeft, ArrowRight } from "react-feather";
import { FC, PropsWithChildren, useMemo } from "react";
import { useNavigationStore } from "lib/stores/NavigationStore";
import { useStore } from "lib/stores/Store";
import { motion } from "framer-motion";

export interface DrawerProps {
  side: "left" | "right";
  className?: string;
}

const Drawer: FC<PropsWithChildren<DrawerProps>> = observer(
  ({ side, className = "", children }) => {
    const store = useStore();
    const navigationStore = useNavigationStore();
    const isClosed =
      side === "left" ? store.leftDrawerClosed : store.rightDrawerClosed;

    const Arrow = useMemo(() => {
      if (!isClosed) {
        return side === "right" ? ArrowRight : ArrowLeft;
      } else {
        return side === "right" ? ArrowLeft : ArrowRight;
      }
    }, [side, isClosed]);

    const toggle = () => {
      store.toggleDrawer(side);

      if (side === "left") {
        if (store.leftDrawerClosed) {
          navigationStore.setCurrentGroupOpenState(false);
        }
      }
    };
    const getWidth = () => {
      if (side === "left") {
        return isClosed === false ? 256 : 96;
      } else {
        return isClosed === false ? 360 : 0;
      }
    };

    return (
      <motion.div
        onAnimationStart={() => {
          store.toggleDrawerAnimation(side, true);
        }}
        onAnimationComplete={() => {
          store.toggleDrawerAnimation(side, false);
        }}
        animate={{ width: getWidth() }}
        transition={{ type: "tween" }}
        className={`
        !hidden drawer relative h-ztg-full-vh flex-shrink-0 ${side} ${
          isClosed ? "closed" : ""
        } ${className}`}
      >
        <div
          className="arrow-container border-2 border-sky-300 bg-white text-sky-600 dark:bg-black
          dark:border-border-dark absolute top-ztg-90 right-0 w-ztg-24 h-ztg-24 rounded-ztg-5 flex
          items-center justify-center cursor-pointer z-ztg-3"
          onClick={() => toggle()}
        >
          <Arrow size={16} />
        </div>
        <div className="overflow-hidden h-full">{children}</div>
      </motion.div>
    );
  },
);

export default Drawer;
