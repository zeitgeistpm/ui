import { motion, Variants } from "framer-motion";
import { useStore } from "lib/stores/Store";
import { Theme, useUserStore } from "lib/stores/UserStore";
import { observer } from "mobx-react";
import { FC, HTMLProps } from "react";
import { Moon, Sun } from "react-feather";

const ThemeIcon: FC<{
  theme: Theme;
  selected: boolean;
  onClick: () => void;
  className?: string;
}> = observer(({ theme, selected, onClick, className = "" }) => {
  const Icon = theme === "dark" ? Moon : Sun;
  return (
    <div
      className={`rounded-full w-ztg-34 h-ztg-34 cursor-pointer center flex-shrink-0
        ${
          selected ? "text-ztg-blue" : "text-sky-400 dark:text-sky-600"
        } ${className}`}
      onClick={() => onClick()}
    >
      <Icon size={18} style={{ zIndex: 40 }} />
    </div>
  );
});

const ThemeSwitch: FC<HTMLProps<HTMLDivElement>> = observer(({ ...props }) => {
  const store = useStore();
  const userStore = useUserStore();
  // const compact = store.leftDrawerClosed && store.showMobileMenu === false;

  const { className, ...restProps } = props;

  const variants: Variants = {
    light: { x: 0 },
    dark: { x: 50 },
  };

  return (
    <div className={`flex ${className || ""}`} {...restProps}>
      {/* {compact === true ? (
        <ThemeIcon
          theme={userStore.theme}
          onClick={() => {
            userStore.toggleTheme();
          }}
          selected={true}
        />
      ) : ( */}
      <div className="flex bg-sky-200 dark:bg-sky-700 rounded-ztg-100 py-ztg-4 px-ztg-6">
        <motion.div
          variants={variants}
          animate={userStore.theme === "light" ? "light" : "dark"}
          className={`rounded-full w-ztg-34 h-ztg-34 cursor-pointer center flex-shrink-0 absolute bg-white dark:bg-black`}
        ></motion.div>
        <ThemeIcon
          theme="light"
          onClick={() => userStore.toggleTheme("light")}
          selected={userStore.theme === "light"}
          className="mr-ztg-16 z-40"
        />
        <ThemeIcon
          theme="dark"
          onClick={() => userStore.toggleTheme("dark")}
          selected={userStore.theme === "dark"}
        />
      </div>
      {/* )} */}
    </div>
  );
});

export default ThemeSwitch;
