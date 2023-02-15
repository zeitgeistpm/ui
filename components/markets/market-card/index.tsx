import Link from "next/link";
import React, { useState } from "react";
import MarketImage from "components/ui/MarketImage";
import { MarketOutcomes } from "lib/types/markets";
import MarketCardContext from "./context";
import { motion } from "framer-motion";
import ScalarPriceRange from "../ScalarPriceRange";
import { Users, BarChart2, Droplet } from "react-feather";
export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  outcomes: MarketOutcomes;
  marketType: { categorical?: string; scalar?: string[] };
  scalarType: string | null;
  prediction: { name: string; price: number };
  volume: number;
  baseAsset: string;
  tags: string[];
  status: string;
  endDate: string;
}
export interface MarketCardProps extends IndexedMarketCardData {
  className?: string;
  width?: number;
}

const Pill = ({ value, classes }: { value: string; classes: string }) => {
  return (
    <span className={`px-2.5 py-0.5 h-fit text-xs rounded ${classes}`}>
      {value}
    </span>
  );
};

const MarketCardInfo = ({ question }: { question: string }) => {
  return (
    <div className="w-full h-full flex flex-col text-ztg-14-165 whitespace-normal">
      <h5 className="font-semibold text-lg w-full h-fit line-clamp-3">
        {question}
      </h5>
    </div>
  );
};

const MarketCardTags = ({ tags }: { tags: string[] }) => {
  return (
    <>
      {tags.map((tag, index) => {
        return (
          <Pill
            key={index}
            value={tag}
            classes="text-blue-dark bg-blue-light"
          />
        );
      })}
    </>
  );
};

const MarketCardPredictionBar = ({
  prediction: { name, price },
  volume,
  isHovered,
}: {
  prediction: { name: string; price: number };
  volume: number;
  isHovered: boolean;
}) => {
  // check if market has liquidity
  if (volume > 0) {
    const impliedPercentage = Math.round(Number(price) * 100);

    return (
      <>
        <div className="text-sm flex justify-between mb-1">
          <span className="text-blue">{name}</span>
          <span
            style={{
              color: `${isHovered ? "#FFFFFF" : "#6b7280"}`,
              transition: "color 500ms ease",
            }}
          >
            {impliedPercentage}%
          </span>
        </div>
        <div
          className={`w-full rounded-lg h-1.5`}
          style={{
            backgroundColor: `${isHovered ? "#FFFFFF" : "#E5E7EB"}`,
            transition: "background-color 500ms ease",
          }}
        >
          <div
            className={`rounded-lg h-full transition-all bg-blue`}
            style={{
              width: `${isNaN(impliedPercentage) ? 0 : impliedPercentage}%`,
            }}
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="text-sm flex justify-between mb-1">
          <span className="text-gray-500">No liquidity in this market</span>
          <span className="text-gray-500">0%</span>
        </div>
        <div className="w-full rounded-lg h-1.5 bg-gray-200"></div>
      </>
    );
  }
};

const MarketCardDetails = ({
  rows,
}: {
  rows: {
    volume: number;
    baseAsset: string;
    outcomes: number;
    endDate: string;
    hasEnded: boolean;
    marketType: { categorical?: string; scalar?: string[] };
  };
}) => {
  return (
    <div>
      <div className="text-xs mb-2.5">
        <span className="font-semibold">{rows.outcomes} outcomes</span>
        <span>
          {rows.endDate &&
            ` | ${rows.hasEnded ? "Ends" : "Ended"} ${new Date(
              Number(rows?.endDate),
            ).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}`}
        </span>
      </div>
      <div className="flex gap-2.5 text-sm">
        {/* TODO: add market particpants and liquidity once added to indexer */}
        {/* <div className="flex items-center gap-2">
            <Users size={18} />
            <span>223</span>
          </div> */}
        <div className="flex items-center gap-2">
          <BarChart2 size={18} />
          <span>
            {new Intl.NumberFormat("default", {
              maximumSignificantDigits: 3,
              notation: "compact",
            }).format(Number(rows.volume))}{" "}
            {rows.baseAsset}
          </span>
        </div>
        {/* <div className="flex items-center gap-2">
            <Droplet size={18} />
            <span>223K ZTG</span>
          </div> */}
      </div>
    </div>
  );
};

const MarketCard = ({
  marketId,
  img,
  question,
  creation,
  outcomes,
  marketType,
  prediction,
  scalarType,
  volume,
  baseAsset,
  width,
  tags,
  endDate,
  status,
  className = "",
}: MarketCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const hasEnded = () => {
    const currentTime = new Date();
    const endTime = Number(endDate);
    const diff = endTime - currentTime.getTime();
    return diff >= 0 ? true : false;
  };

  const isEnding = () => {
    const currentTime = new Date();
    const endTime = Number(endDate);
    //6 hours in milliseconds
    const sixHours = 21600000;
    const diff = endTime - currentTime.getTime();
    //checks if event has passed and is within 6 hours
    return diff < sixHours && diff > 0 ? true : false;
  };

  const isVerified = () => {
    return creation === "Advised" && status === "Proposed" ? true : false;
  };

  const infoRows = {
    marketType: marketType,
    endDate: endDate,
    hasEnded: hasEnded(),
    outcomes: outcomes.length,
    volume: volume,
    baseAsset: baseAsset?.toUpperCase() ?? "ZTG",
  };

  const lower = Number(marketType?.scalar?.[0]) / 10 ** 10;
  const upper = Number(marketType?.scalar?.[1]) / 10 ** 10;

  return (
    <MarketCardContext.Provider value={{ baseAsset }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`marketCard-${marketId}`}
        className={`flex flex-col w-full h-auto rounded-[10px] p-[15px] relative ${className}`}
        style={{
          borderRadius: "10px",
          backgroundColor: isHovered ? "#B5C1CA" : "#F0F2F5",
          transition: "background-color 500ms ease",
          minWidth: isNaN(width) ? "100%" : width,
          maxWidth: isNaN(width) ? "100%" : width,
        }}
      >
        <Link
          href={`/markets/${marketId}`}
          className="flex flex-col flex-1 gap-2.5"
        >
          <div className="flex gap-2.5">
            <MarketImage image={img} alt={question} />
            <div className="flex flex-wrap gap-2.5 font-medium h-fit">
              <MarketCardTags tags={tags} />
              {isEnding() && (
                <Pill value="Ends Soon" classes="bg-red-light text-red" />
              )}
              {isVerified() && (
                <Pill
                  value="&#x2713; Verified"
                  classes="bg-green-light text-green"
                />
              )}
            </div>
          </div>
          <MarketCardInfo question={question} />
          <div className="w-full">
            {scalarType ? (
              <ScalarPriceRange
                scalarType={scalarType}
                lowerBound={lower}
                upperBound={upper}
                shortPrice={outcomes[1].price}
                longPrice={outcomes[0].price}
              />
            ) : (
              <MarketCardPredictionBar
                isHovered={isHovered}
                volume={volume}
                prediction={prediction}
              />
            )}
          </div>
          <MarketCardDetails rows={infoRows} />
        </Link>
      </div>
    </MarketCardContext.Provider>
  );
};

export default MarketCard;
