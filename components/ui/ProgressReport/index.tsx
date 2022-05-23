import { useEffect, useState } from "react";
import Countdown from "./Countdown";
import TimeLine, { TimeLineStage } from "./TimeLine";

interface ProgressReportProps {
  title: string;
  description: string;
  totalTime: number;
  remainingTime: number;
  currentStageIndex?: number;
  stages: TimeLineStage[];
}

const ProgressReport = ({
  title,
  description,
  totalTime,
  remainingTime,
  stages,
  currentStageIndex,
}: ProgressReportProps) => {
  const [percentage, setPercentage] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  const handleTick = (remainingTime: number) => {
    if (currentStageIndex != null) {
      setPercentage(stages[currentStageIndex].percentage);
    } else {
      const percentage = 1 - remainingTime / totalTime;
      setPercentage(percentage);
    }
  };

  useEffect(() => {
    const ref = setTimeout(() => {
      setSecondsElapsed((t) => t + 1);
      handleTick(remainingTime - secondsElapsed);
    }, 1000);
    return () => {
      clearTimeout(ref);
    };
  }, [secondsElapsed, handleTick]);

  useEffect(() => {
    if (remainingTime != null) {
      setSecondsElapsed(0);
      setTimerKey(timerKey + 1);
    }
  }, [remainingTime]);

  return (
    <div className="w-full flex">
      {remainingTime != null && totalTime ? (
        <Countdown
          timerKey={timerKey}
          secondsRemaining={remainingTime}
          totalTime={totalTime}
        />
      ) : (
        <></>
      )}
      <div className="w-full flex flex-col justify-center ml-ztg-20">
        <div className="font-bold text-ztg-18-150">{title}</div>
        <div className="font text-ztg-14-150 text-sky-600 mb-ztg-11">
          {description}
        </div>
        <TimeLine
          stages={stages}
          currentStage={{ index: currentStageIndex, percentage: percentage }}
        />
      </div>
    </div>
  );
};

export default ProgressReport;
