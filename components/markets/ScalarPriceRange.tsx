import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { useMemo } from "react";
import { useResizeDetector } from "react-resize-detector";

interface ScalarPriceRangeProps {
  scalarType: ScalarRangeType;
  lowerBound: number;
  upperBound: number;
  shortPrice: number; //between 0 and 1
  longPrice: number; //between 0 and 1
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
  const shortPercentage = 1 - shortPrice;
  const longPercentage = longPrice;
  const averagePercentage = (shortPercentage + longPercentage) / 2;
  const averagePosition = width * averagePercentage;

  const position = useMemo(() => {
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
      : lowerBound;

  const upperDisplay =
    scalarType === "date"
      ? new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
        }).format(new Date(upperBound))
      : upperBound;

  const positionDisplay =
    scalarType === "date"
      ? new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
        }).format(new Date(position))
      : position.toFixed(2);

  return (
    <div
      className="`w-full h-[30px] transition-all group-hover:bg-white bg-gray-200 relative overflow-hidden flex items-center"
      ref={ref}
    >
      {status !== "Proposed" && (
        <>
          <div
            style={{
              width: `${isNaN(averagePosition) ? 0 : averagePosition}px`,
            }}
            className="bg-scalar-bar h-full absolute left-0 bottom-0"
          ></div>
          <span className="text-scalar-text text-sm px-2.5 z-10 relative">
            Current Prediction: {positionDisplay}
          </span>
        </>
      )}
    </div>
  );
};

export default ScalarPriceRange;
