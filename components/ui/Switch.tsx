import { observer } from "mobx-react";
import { useEffect, useState } from "react";

interface SwitchProps {
  leftLabel: string;
  rightLabel: string;
  onLeftSideClick: () => void;
  onRightSideClick: () => void;
  initialSelection?: SwitchSide;
}
type SwitchSide = "left" | "right";

const Switch = observer(
  ({
    leftLabel,
    rightLabel,
    onLeftSideClick,
    onRightSideClick,
    initialSelection = "left",
  }: SwitchProps) => {
    const [selectedSide, setSelectedSide] = useState<SwitchSide>("left");

    useEffect(() => {
      setSelectedSide(initialSelection);
    }, []);

    const handleLeftClick = () => {
      setSelectedSide("left");
      onLeftSideClick();
    };

    const handleRightClick = () => {
      setSelectedSide("right");
      onRightSideClick();
    };

    return (
      <div className="flex items-center h-ztg-30 overflow-hidden rounded-full cursor-pointer text-ztg-14-110 font-bold mb-ztg-16">
        <div
          className="h-full w-1/2 center"
          style={{
            background: selectedSide === "left" ? "#000" : "#b7b7b7",
            color: selectedSide === "left" ? "#fff" : "#000",
          }}
          onClick={handleLeftClick}
        >
          {leftLabel}
        </div>
        <div
          className="h-full w-1/2 center text-white"
          style={{
            background: selectedSide === "right" ? "#000" : "#b7b7b7",
            color: selectedSide === "right" ? "#fff" : "#000",
          }}
          onClick={handleRightClick}
        >
          {rightLabel}
        </div>
      </div>
    );
  }
);

export default Switch;
