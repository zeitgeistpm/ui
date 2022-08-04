import { DAY_SECONDS } from "lib/constants";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

interface CountdownProps {
  secondsRemaining: number;
  totalTime: number;
  timerKey: number;
}

const TimerContent = ({ title, time }: { title: string; time: string }) => {
  return (
    <div className="flex flex-col justify-center bg-sky-200 dark:bg-sky-700 py-ztg-12 px-ztg-15 mt-ztg-4 rounded-ztg-5">
      <div className="text-sky-600 font-bold text-ztg-12-120">{title}</div>
      <div className="text-black dark:text-white font-bold text-ztg-16-120 whitespace-nowrap">
        {time}
      </div>
    </div>
  );
};

const timerProps = {
  isPlaying: true,
  size: 80,
  strokeWidth: 0,
  trailColor: "#748296",
  colors: "#748296",
};

const Countdown = observer(
  ({ secondsRemaining, totalTime, timerKey = 0 }: CountdownProps) => {
    const [dayTimer, setDayTimer] = useState<boolean>();

    useEffect(() => {
      evaluateTimerType(secondsRemaining);
    }, [secondsRemaining]);

    const evaluateTimerType = (secondsRemaning: number) => {
      if (secondsRemaning > DAY_SECONDS * 2) {
        setDayTimer(true);
      } else {
        setDayTimer(false);
      }
    };

    if (dayTimer === true) {
      return (
        <CountdownCircleTimer
          {...timerProps}
          key={timerKey}
          duration={totalTime}
          initialRemainingTime={secondsRemaining}
        >
          {(val) => {
            return (
              <TimerContent
                title="Ends in"
                time={`${(
                  (val.remainingTime / DAY_SECONDS) |
                  0
                ).toString()} Days`}
              />
            );
          }}
        </CountdownCircleTimer>
      );
    } else if (dayTimer === false) {
      return (
        <CountdownCircleTimer
          {...timerProps}
          key={timerKey}
          duration={totalTime}
          initialRemainingTime={secondsRemaining}
        >
          {(val) => {
            const days = Math.floor(val.remainingTime / DAY_SECONDS);
            const remainderFromdays = val.remainingTime % DAY_SECONDS;
            const isoString = new Date(remainderFromdays * 1000)
              .toISOString()
              .slice(11, 19);
            let isoArray = isoString.split(":");
            const hours = Number(isoArray[0]) + days * 24;
            isoArray[0] = hours.toString();
            const timeString = isoArray.join(":");
            return <TimerContent title="Ends in" time={timeString} />;
          }}
        </CountdownCircleTimer>
      );
    } else {
      return <></>;
    }
  },
);

export default Countdown;
