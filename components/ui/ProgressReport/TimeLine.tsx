import { observer } from "mobx-react";
import ProgressBar, { ProgressBarEvent } from "./ProgressBar";
import { TimeLineContextProvider } from "./TimeLineContext";

export interface TimeLineStage {
  fillColor: string;
  percentage: number; // between 0 and 1
  className?: string;
  events?: ProgressBarEvent[];
}

interface TimeLineProps {
  stages: TimeLineStage[];
  currentStage?: {
    index: number;
    percentage: number;
  };
}

const TimeLine = observer(({ stages, currentStage }: TimeLineProps) => {
  return (
    <TimeLineContextProvider>
      <div className="flex">
        {stages.map((stage, i) => (
          <ProgressBar
            key={i}
            id={i}
            percentage={
              currentStage?.index === i && currentStage.percentage
                ? currentStage.percentage
                : stage.percentage
            }
            barColor={stage.fillColor}
            className={stage.className}
            events={stage.events}
          />
        ))}
      </div>
    </TimeLineContextProvider>
  );
});

export default TimeLine;
