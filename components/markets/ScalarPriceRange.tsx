import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
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
}

const ScalarPriceRange = ({
  scalarType,
  lowerBound,
  upperBound,
  shortPrice,
  longPrice,
  status,
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
      className="w-full h-[30px] transition-all group-hover:bg-white bg-gray-200 relative flex items-center p-2"
      ref={ref}
    >
      <span className="text-xs text-gray-400 z-10 font-semibold">
        {lowerDisplay}
      </span>
      {status !== "Proposed" && (
        <>
          <div
            style={{
              width: `${averagePosition != null ? averagePosition : 0}px`,
            }}
            className="bg-scalar-bar h-full absolute left-0 bottom-0"
          ></div>
          <span className="text-scalar-text text-sm px-2.5 z-10 relative">
            Prediction: {positionDisplay}
          </span>
        </>
      )}
      <span className="text-xs text-gray-400 z-10 ml-auto font-semibold">
        {upperDisplay}
      </span>
    </div>
  );
};

export default ScalarPriceRange;
