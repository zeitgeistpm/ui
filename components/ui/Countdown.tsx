import { observer } from "mobx-react";
import { FC, useEffect, useState } from "react";

/**
 * Function returns object with hours, minutes & seconds as properties
 *
 * @param sec: number
 * @returns object
 */
export const toHMS = (
  sec: number
): { hours: string; minutes: string; seconds: string } => {
  if (sec < 0) {
    return;
  }
  const pad = (n: number): string => {
    return n < 10 ? `0${n}` : `${n}`;
  };
  if (sec < 60) {
    return { hours: "00", minutes: "00", seconds: `${pad(sec)}` };
  }
  if (sec < 3600) {
    const minutes = Math.floor(sec / 60);
    const seconds = sec - minutes * 60;
    return {
      hours: "00",
      minutes: `${pad(minutes)}`,
      seconds: `${pad(seconds)}`,
    };
  }
  if (Math.floor(sec / 3600).toFixed(0) === "24") {
    return { hours: "24", minutes: "00", seconds: "00" };
  }
  const hours = Math.floor(sec / 3600);
  let secsLeft = sec - hours * 3600;
  const minutes = Math.floor(secsLeft / 60);
  secsLeft = secsLeft - minutes * 60;
  return {
    hours: `${pad(hours)}`,
    minutes: `${pad(minutes)}`,
    seconds: `${pad(secsLeft)}`,
  };
};

interface CountdownProps {
  seconds: number;
}

const degSeconds = (24 * 3600) / 360; // seconds in one degree of a circle
const circleR = 80;
const circleLen = Math.PI * 2 * circleR;

const TICK_TIMEOUT = 1000;

const useTicker = () => {
  const [tick, setTick] = useState<number>(1);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setTick((t) => t + 1);
    }, TICK_TIMEOUT);
    return () => {
      window.clearTimeout(id);
    };
  }, [tick]);

  return tick;
}

const Countdown: FC<CountdownProps> = observer(({ seconds }) => {
  const [secsLeft, setSecsLeft] = useState<number>(seconds);
  const [deg, setDeg] = useState(360);

  const tick = useTicker();

  const formatted = (): string => {
    const o = toHMS(secsLeft);
    return `${o.hours}:${o.minutes}:${o.seconds}`;
  };

  useEffect(() => {
    setSecsLeft((s) => s - 1);
  }, [tick]);

  useEffect(() => {
    // sync with blocks every 30 minutes
    if (seconds % 1800 === 0) {
      setSecsLeft(seconds);
    }
  }, [seconds]);

  useEffect(() => {
    setDeg(secsLeft / degSeconds);
  }, [secsLeft]);

  return (
    <div id="countdownContainer" className="flex items-center">
      <div className="relative inline-block mx-auto">
        <svg
          width={2 * circleR}
          viewBox={`0 0 ${2 * circleR + 20} ${2 * circleR + 20}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform={`translate(${circleR + 10}, ${circleR + 10})`}>
            <circle r={circleR} className="e-c-base" />
            <g transform="rotate(-90)">
              <circle
                r={circleR}
                className="e-c-progress"
                style={{
                  strokeDasharray: circleLen,
                  strokeDashoffset: circleLen * (1 - (1 / 360) * deg),
                }}
              />
              <g id="e-pointer">
                <circle
                  transform={`rotate(${deg})`}
                  cx={circleR}
                  cy="0"
                  r="4"
                  className="e-c-pointer"
                />
              </g>
            </g>
          </g>
        </svg>
        <p
          className="text-white absolute left-1/2 top-1/2 text-2xl"
          style={{ transform: `translateY(-50%) translateX(-50%)` }}
        >
          {formatted()}
        </p>
      </div>
    </div>
  );
});

export default Countdown;
