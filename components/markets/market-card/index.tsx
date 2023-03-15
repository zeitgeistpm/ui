import Link from "next/link";
import React, { useState } from "react";
import MarketImage from "components/ui/MarketImage";
import Heading from "components/ui/Heading";
import { MarketOutcomes } from "lib/types/markets";
import MarketCardContext from "./context";
import ScalarPriceRange from "../ScalarPriceRange";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { Users, BarChart2, Droplet } from "react-feather";
import { formatNumberCompact } from "lib/util/format-compact";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { Skeleton } from "@material-ui/lab";

export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  outcomes: MarketOutcomes;
  marketType: { categorical?: string; scalar?: string[] };
  scalarType: ScalarRangeType;
  prediction: { name: string; price: number };
  volume: number;
  pool: null | {};
  baseAsset: string;
  tags?: string[];
  status: string;
  endDate: string;
  liquidity?: string;
  numParticipants?: number;
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
      <Heading as="h4" className="w-full h-fit line-clamp-3">
        {question}
      </Heading>
    </div>
  );
};

const MarketCardTags = ({ tags }: { tags: string[] }) => {
  return (
    <>
      {tags?.map((tag, index) => {
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
  pool,
  isHovered,
}: {
  prediction: { name: string; price: number };
  pool: null | {};
  isHovered: boolean;
}) => {
  // check if market has liquidity
  if (pool !== null) {
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
    numParticipants?: number;
    liquidity?: string;
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
        {rows.numParticipants != null ? (
          <div className="flex items-center gap-2 w-[50px]">
            <Users size={18} />
            <span>{rows.numParticipants}</span>
          </div>
        ) : (
          <Skeleton width={50} />
        )}
        <div className="flex items-center gap-2">
          <BarChart2 size={18} />
          <span>
            {formatNumberCompact(rows.volume)} {rows.baseAsset}
          </span>
        </div>
        {rows.liquidity != null ? (
          <div className="flex items-center gap-2 w-[120px]">
            <Droplet size={18} />
            <span>
              {formatNumberCompact(
                new Decimal(rows.liquidity).div(ZTG).toString(),
              )}{" "}
              {rows.baseAsset}
            </span>
          </div>
        ) : (
          <Skeleton width={120} />
        )}
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
  pool,
  scalarType,
  volume,
  baseAsset,
  width,
  tags = [],
  endDate,
  status,
  className = "",
  liquidity,
  numParticipants,
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
    return creation === "Advised" && status === "Active" ? true : false;
  };

  const isProposed = () => {
    return creation === "Advised" && status === "Proposed" ? true : false;
  };

  const infoRows = {
    marketType: marketType,
    endDate: endDate,
    hasEnded: hasEnded(),
    outcomes: outcomes.length,
    volume: volume,
    baseAsset: baseAsset?.toUpperCase() ?? "ZTG",
    liquidity,
    numParticipants: numParticipants,
  };

  const lower = marketType?.scalar?.[0]
    ? new Decimal(marketType?.scalar?.[0]).div(ZTG).toNumber()
    : 0;
  const upper = marketType?.scalar?.[1]
    ? new Decimal(marketType?.scalar?.[1]).div(ZTG).toNumber()
    : 0;

  return (
    <MarketCardContext.Provider value={{ baseAsset }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`marketCard-${marketId}`}
        className={`group flex flex-col w-full h-auto rounded-xl p-[15px] relative ${className}`}
        style={{
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
              {isProposed() && (
                <Pill value="Proposed" classes="bg-purple-light text-purple" />
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
            {marketType.scalar === null ? (
              <MarketCardPredictionBar
                isHovered={isHovered}
                pool={pool}
                prediction={prediction}
              />
            ) : pool !== null ? (
              <ScalarPriceRange
                scalarType={scalarType}
                lowerBound={lower}
                upperBound={upper}
                shortPrice={outcomes[1].price}
                longPrice={outcomes[0].price}
              />
            ) : (
              <>
                <div className="text-sm flex justify-between mb-1">
                  <span className="text-gray-500">
                    No liquidity in this market
                  </span>
                  <span className="text-gray-500">
                    {lower} - {upper}
                  </span>
                </div>
                <div className="w-full rounded-lg h-1.5 bg-gray-200"></div>
              </>
            )}
          </div>
          <MarketCardDetails rows={infoRows} />
        </Link>
      </div>
    </MarketCardContext.Provider>
  );
};

export default MarketCard;
