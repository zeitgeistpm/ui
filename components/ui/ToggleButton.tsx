import { useUserStore } from "lib/stores/UserStore";
import { observer } from "mobx-react";
import { FC } from "react";

const ToggleButton: FC<{
  isActive: boolean;
  onChange: (isActive: boolean) => void;
  className?: string;
}> = observer(({ isActive = false, onChange, className = "", children }) => {
  const userStore = useUserStore();
  const activeBackground = "black";
  const inactiveTextColor = userStore.theme === "light" ? "black" : "white";

  const toggle = () => {
    onChange(!isActive);
  };

  return (
    <div
      className={
        "h-ztg-32 flex-ztg-basis-80 flex-shrink flex-grow text-center rounded-full center text-ztg-12-150 cursor-pointer mr-ztg-8  dark:text-white " +
        className
      }
      onClick={() => toggle()}
      role="button"
      style={{
        color: isActive ? "white" : inactiveTextColor,
        background: isActive ? activeBackground : "transparent",
      }}
    >
      {children}
    </div>
  );
});

export default ToggleButton;
