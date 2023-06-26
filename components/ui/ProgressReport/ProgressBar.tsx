import { ReactFragment, useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import TimeLineEvent from "./TimeLineEvent";

interface ProgressBarProps {
  id: number;
  percentage: number;
  barColor: string;
  className?: string;
  events?: ProgressBarEvent[];
}

export interface ProgressBarEvent {
  percentage: number;
  color?: string;
  borderColor?: string;
  hoverComponent?: ReactFragment;
}

const ProgressBar = ({
  id,
  percentage,
  barColor,
  className,
  events,
}: ProgressBarProps) => {
  const [progressWidth, setProgressWidth] = useState<number>();

  const { width: barWidth, ref } = useResizeDetector();
  const width = barWidth ?? 0;

  useEffect(() => {
    const progressbarWidth = percentage * width;
    //display dot if progress is very small but not 0
    setProgressWidth(
      progressbarWidth < 6 && progressbarWidth > 0 ? 6 : progressbarWidth,
    );
  }, [percentage, width]);

  const calculateEventPosition = (percentage: number, width: number) => {
    const eventDivWidth = 20;
    const maxPosition = width - eventDivWidth;
    const position = percentage * width;
    const positionInsideBar = position > maxPosition ? maxPosition : position;

    return positionInsideBar;
  };

  return (
    <div className={`relative ${className ?? ""} mr-ztg-10`}>
      <div
        ref={ref}
        className={`h-ztg-6 rounded-full bg-sky-200 dark:bg-black ${
          percentage !== 0 ? "opacity-20" : ""
        }`}
        {...(percentage !== 0 ? { style: { backgroundColor: barColor } } : {})}
      ></div>
      <div
        className="h-full flex justify-center absolute items-center rounded-full top-ztg-0"
        style={{ width: `${progressWidth}px`, backgroundColor: barColor }}
      ></div>
      {events?.map((event, i) => (
        <div
          key={i}
          className="absolute -top-ztg-6 z-10"
          style={{
            left: `${calculateEventPosition(event.percentage, width)}px`,
          }}
        >
          <TimeLineEvent {...event} id={`${id}-${i}`} key={`${id}-${i}`} />
        </div>
      ))}
    </div>
  );
};

export default ProgressBar;
