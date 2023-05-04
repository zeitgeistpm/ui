import { observer } from "mobx-react";
import { useMemo } from "react";
import { useResizeDetector } from "react-resize-detector";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";

interface ScalarPriceRangeProps {
  scalarType: ScalarRangeType;
  lowerBound: number;
  upperBound: number;
  shortPrice: number; //between 0 and 1
  longPrice: number; //between 0 and 1
  status: string;
}

const ScalarPriceRange = observer(
  ({
    scalarType,
    lowerBound,
    upperBound,
    shortPrice,
    longPrice,
    status,
  }: ScalarPriceRangeProps) => {
    const { width, ref } = useResizeDetector();
    const shortPercentage = 1 - shortPrice;
    const longPercentage = longPrice;
    const averagePercentage = (shortPercentage + longPercentage) / 2;
    const averagePosition = width * averagePercentage;

    const inferedType: ScalarRangeType = scalarType ?? "number";

    const lower = useMemo(
      () =>
        inferedType === "number"
          ? new Intl.NumberFormat("default", {
              maximumSignificantDigits: 3,
              notation: "compact",
            }).format(Number(lowerBound))
          : new Intl.DateTimeFormat("default", {
              dateStyle: "medium",
            }).format(lowerBound),
      [lowerBound],
    );

    const upper = useMemo(
      () =>
        inferedType === "number"
          ? new Intl.NumberFormat("default", {
              maximumSignificantDigits: 3,
              notation: "compact",
            }).format(Number(upperBound))
          : new Intl.DateTimeFormat("default", {
              dateStyle: "medium",
            }).format(upperBound),
      [upperBound],
    );

    const position = useMemo(() => {
      const pos =
        (upperBound - lowerBound) * ((1 - shortPrice + longPrice) / 2) +
        lowerBound;
      const decimals = pos > 10 ? 0 : 3;
      return inferedType === "number"
        ? new Intl.NumberFormat("default", {
            maximumSignificantDigits: 3,
            notation: "compact",
          }).format(Number(pos))
        : new Intl.DateTimeFormat("default", {
            dateStyle: "medium",
          }).format(pos);
    }, [upperBound, lowerBound, shortPrice, longPrice]);

    const getMinMaxPosition = (position) => {
      if (position <= 55) {
        return 55;
      } else if (position >= width - 55) {
        return position - 55;
      } else {
        return position;
      }
    };

    return (
      <div ref={ref}>
        <div className="relative top-1.5">
          <div className="flex justify-between">
            <div className="flex flex-col justify-start">
              <span className="mb-2.5 text-sm text-blue">{lower}</span>
            </div>
            <div className="flex flex-col justify-end items-end">
              <span className="mb-2.5 text-sm text-red">{upper}</span>
            </div>
          </div>
          {status !== "Proposed" && (
            <div
              style={{
                width: `${isNaN(averagePosition) ? 0 : averagePosition}px`,
              }}
              className="bg-blue h-1.5 absolute left-0 bottom-0 rounded"
            ></div>
          )}
          {status !== "Proposed" && (
            <div
              className="absolute bottom-ztg-0"
              style={{
                left: `${
                  isNaN(averagePosition)
                    ? 0
                    : getMinMaxPosition(averagePosition)
                }px`,
                transform: "translateX(calc(-50% + 2px))",
              }}
            >
              <div className="flex flex-col items-center">
                <span className="mb-2.5 px-1 bg-white rounded text-sm">
                  {position}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="h-1.5 flex items-center">
          <div className="h-1.5 w-full bg-red rounded"></div>
        </div>
      </div>
    );
  },
);

export default ScalarPriceRange;
