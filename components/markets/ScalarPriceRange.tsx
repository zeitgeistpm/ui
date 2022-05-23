import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { motion } from "framer-motion";

interface ScalarPriceRangeProps {
  lowerBound: number;
  upperBound: number;
  shortPrice: number; //between 0 and 1
  longPrice: number; //between 0 and 1
}

const ScalarPriceRange = observer(
  ({
    lowerBound,
    upperBound,
    shortPrice,
    longPrice,
  }: ScalarPriceRangeProps) => {
    const { width, ref } = useResizeDetector();
    const [shortPosition, setShortPosition] = useState<number>();
    const [longPosition, setLongPosition] = useState<number>();
    const [averagePosition, setAveragePosition] = useState<number>();

    useEffect(() => {
      const shortPercentage = 1 - shortPrice;
      const longPercentage = longPrice;
      const averagePercentage = (shortPercentage + longPercentage) / 2;
      setShortPosition(width * shortPercentage);
      setLongPosition(width * longPercentage);
      setAveragePosition(width * averagePercentage);
    }, [shortPrice, longPrice, width]);

    const showShortAndLongPrices = Math.abs(1 - shortPrice - longPrice) > 0.03;

    return (
      <div ref={ref} className="mt-ztg-20 mb-ztg-30 mx-ztg-20">
        <div className="relative top-ztg-6 ">
          <div className="flex justify-between font-mono">
            <div className="flex flex-col justify-start">
              <div className="mb-ztg-8">{lowerBound}</div>
              <div className="bg-sky-500 h-ztg-6 w-ztg-6 rounded-full"></div>
            </div>
            <div className="flex flex-col justify-end items-end">
              <div className="mb-ztg-8">{upperBound}</div>
              <div className="bg-sky-500 h-ztg-6 w-ztg-6 rounded-full"></div>
            </div>
          </div>
          {showShortAndLongPrices && (
            <motion.div
              layout
              className="bg-vermilion h-ztg-6 w-ztg-6 rounded-full absolute bottom-ztg-0"
              style={{ left: `${shortPosition}px` }}
            ></motion.div>
          )}
          <div
            className="absolute bottom-ztg-0"
            style={{
              left: `${averagePosition}px`,
              transform: "translateX(calc(-50% + 2px))",
            }}
          >
            <div className="flex flex-col items-center font-mono">
              <div className="mb-ztg-8">
                {(
                  (upperBound - lowerBound) *
                    ((1 - shortPrice + longPrice) / 2) +
                  lowerBound
                ).toFixed(0)}
              </div>
              <div className="bg-sky-500 h-ztg-6 w-ztg-6 rounded-full"></div>
            </div>
          </div>

          {showShortAndLongPrices && (
            <motion.div
              layout
              className="bg-sheen-green h-ztg-6 w-ztg-6 rounded-full absolute bottom-ztg-0"
              style={{ left: `${longPosition}px` }}
            ></motion.div>
          )}
        </div>
        <div className="h-ztg-5 flex items-center">
          <div className="h-ztg-2 w-full bg-sky-600"></div>
        </div>
      </div>
    );
  }
);

export default ScalarPriceRange;
