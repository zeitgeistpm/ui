import { observer } from "mobx-react";
import { useMemo } from "react";
import { useResizeDetector } from "react-resize-detector";
import { motion } from "framer-motion";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import moment from "moment";

interface ScalarPriceRangeProps {
  scalarType: string | ScalarRangeType;
  lowerBound: number;
  upperBound: number;
  shortPrice: number; //between 0 and 1
  longPrice: number; //between 0 and 1
}

const ScalarPriceRange = observer(
  ({
    scalarType,
    lowerBound,
    upperBound,
    shortPrice,
    longPrice,
  }: ScalarPriceRangeProps) => {
    const { width, ref } = useResizeDetector();

    const shortPercentage = 1 - shortPrice;
    const longPercentage = longPrice;
    const averagePercentage = (shortPercentage + longPercentage) / 2;
    const averagePosition = width * averagePercentage;
    const shortPosition = width * shortPercentage;
    const longPosition = width * longPercentage;

    const showShortAndLongPrices = Math.abs(1 - shortPrice - longPrice) > 0.03;
    const inferedType: string | ScalarRangeType = scalarType ?? "number";

    const dateFormat = "MM.DD.YYYY";

    const lower = useMemo(
      () =>
        inferedType === "number"
          ? new Intl.NumberFormat("default", {
              maximumSignificantDigits: 3,
              notation: "compact",
            }).format(Number(lowerBound))
          : moment(lowerBound).format(dateFormat),
      [lowerBound],
    );

    const upper = useMemo(
      () =>
        inferedType === "number"
          ? new Intl.NumberFormat("default", {
              maximumSignificantDigits: 3,
              notation: "compact",
            }).format(Number(upperBound))
          : moment(upperBound).format(dateFormat),
      [upperBound],
    );
    // new Intl.DateTimeFormat("en-US", {
    //   dateStyle: "medium",
    // }).format(Number(indexedMarket.period.end))

    const position = useMemo(() => {
      const pos =
        (upperBound - lowerBound) * ((1 - shortPrice + longPrice) / 2) +
        lowerBound;
      const decimals = pos > 10 ? 0 : 3;
      return inferedType === "number"
        ? pos.toFixed(decimals)
        : moment(pos).format(dateFormat);
    }, [upperBound, lowerBound, shortPrice, longPrice]);

    console.log(scalarType, averagePosition);

    return (
      <div ref={ref}>
        <div className="relative top-1.5 ">
          <div className="flex justify-between">
            <div className="flex flex-col justify-start">
              <span className="mb-2.5 text-sm text-blue">{lower}</span>
            </div>
            <div className="flex flex-col justify-end items-end">
              <span className="mb-2.5 text-sm text-red">{upper}</span>
            </div>
          </div>
          {showShortAndLongPrices && (
            <motion.div
              layout
              className="bg-vermilion h-1.5 w-1.5 rounded-full absolute bottom-ztg-0"
              style={{ left: `${shortPosition}px` }}
            ></motion.div>
          )}
          <div
            style={{ width: averagePosition }}
            className="bg-blue h-1.5 absolute left-0 bottom-0 rounded-l"
          ></div>
          <div
            className="absolute bottom-ztg-0"
            style={{
              left: `${averagePosition}px`,
              transform: "translateX(calc(-50% + 2px))",
            }}
          >
            <div className="flex flex-col items-center">
              <span className="mb-2.5 px-1 bg-white rounded text-sm">
                {position}
              </span>
            </div>
          </div>

          {showShortAndLongPrices && (
            <motion.div
              layout
              className="bg-sheen-green h-1.5 w-1.5 rounded-full absolute bottom-ztg-0"
              style={{ left: `${longPosition}px` }}
            ></motion.div>
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
