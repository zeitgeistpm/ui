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
      className={`relative flex h-[30px]  w-full items-center overflow-hidden bg-gray-200 p-2 transition-all ${className}`}
      ref={ref}
    >
      <span className="z-10 text-xs font-semibold text-gray-400">
        {lowerDisplay}
      </span>
      {status !== "Proposed" && (
        <>
          <div
            style={{
              width: `${averagePosition != null ? averagePosition : 0}px`,
            }}
            className="absolute bottom-0 left-0 h-full bg-scalar-bar"
          ></div>
          <span className="relative px-2.5 text-sm  text-scalar-text">
            Prediction: {positionDisplay}
          </span>
        </>
      )}
      <span className="z-10 ml-auto text-xs font-semibold text-gray-400">
        {upperDisplay}
      </span>
    </div>
  );
};

export default ScalarPriceRange;
