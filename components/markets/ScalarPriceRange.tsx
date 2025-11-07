import type { ScalarRangeType } from "@zeitgeistpm/sdk";
import { formatNumberCompact } from "lib/util/format-compact";
import { useMemo } from "react";
import { useResizeDetector } from "react-resize-detector";

interface ScalarPriceRangeProps {
  scalarType: ScalarRangeType;
  lowerBound: number;
  upperBound: number;
  shortPrice?: number; //between 0 and 1
  longPrice?: number; //between 0 and 1
  status: string;
  className?: string;
}

const ScalarPriceRange = ({
  scalarType,
  lowerBound,
  upperBound,
  shortPrice,
  longPrice,
  status,
  className,
}: ScalarPriceRangeProps) => {
  const { width = 0, ref } = useResizeDetector();
  const shortPercentage = shortPrice && 1 - shortPrice;
  const longPercentage = longPrice;
  const averagePercentage =
    shortPercentage && longPercentage && (shortPercentage + longPercentage) / 2;
  const averagePosition = averagePercentage && width * averagePercentage;

  const position = useMemo(() => {
    if (!shortPrice || !longPrice) {
      return 0;
    }
    const pos =
      (upperBound - lowerBound) * ((1 - shortPrice + longPrice) / 2) +
      lowerBound;
    return pos;
  }, [upperBound, lowerBound, shortPrice, longPrice]);

  const lowerDisplay =
    scalarType === "date"
      ? new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
        }).format(new Date(lowerBound))
      : formatNumberCompact(lowerBound);

  const upperDisplay =
    scalarType === "date"
      ? new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
        }).format(new Date(upperBound))
      : formatNumberCompact(upperBound);

  const positionDisplay =
    scalarType === "date"
      ? new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
        }).format(new Date(position))
      : formatNumberCompact(position);

  return (
    <div
      className={`relative flex h-6 w-full items-center overflow-hidden rounded-lg bg-white/10 px-2.5 shadow-md backdrop-blur-sm transition-all sm:h-[30px] sm:px-4 ${className}`}
      ref={ref}
    >
      <span className="z-10 text-xs font-semibold text-white/90 sm:text-sm">
        {lowerDisplay}
      </span>
      {status !== "Proposed" && (
        <>
          <div
            style={{
              width: `${averagePosition != null ? averagePosition : 0}px`,
            }}
            className="absolute bottom-0 left-0 h-full bg-gradient-to-r from-ztg-green-500/60 to-ztg-green-400/70 transition-all"
          ></div>
          <span className="relative z-10 px-2.5 text-xs font-semibold text-white sm:text-sm">
            Prediction: {positionDisplay}
          </span>
        </>
      )}
      <span className="z-10 ml-auto text-xs font-semibold text-white/90 sm:text-sm">
        {upperDisplay}
      </span>
    </div>
  );
};

export default ScalarPriceRange;
