import Link from "next/link";
import React from "react";
import { Skeleton } from "@material-ui/lab";
import MarketImage from "components/ui/MarketImage";
import { MarketOutcomes } from "lib/types/markets";
import MarketCardContext from "./context";
import { motion } from "framer-motion";
import Decimal from "decimal.js";
import { Users, BarChart2, Droplet } from "react-feather";

import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";

export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  outcomes: MarketOutcomes;
  marketType: { categorical?: string; scalar?: string[] };
  prediction: string;
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

const MarketCardInfo = ({ question }: { question: string }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center text-ztg-14-165 whitespace-normal">
      <h5 className="font-semibold text-lg w-full h-fit line-clamp-3">
        {question}
      </h5>
    </div>
  );
};

const Pill = ({ value, classes }: { value: string; classes: string }) => {
  return (
    <span className={`px-2.5 ml-2.5 py-0.5 h-fit text-xs rounded ${classes}`}>
      {value}
    </span>
  );
};

const MarketCardTags = ({ tags }: { tags: string[] }) => {
  return (
    <>
      {!tags ? (
        <Skeleton height={20} width={100} variant="rect" className="ml-2.5" />
      ) : (
        tags.map((tag) => {
          return <Pill value={tag} classes="text-blue-dark bg-blue-light" />;
        })
      )}
    </>
  );
};

const MarketCardPredictionBar = ({
  details,
  volume,
}: {
  details: { price: number; name: string };
  volume: number;
}) => {
  if (details) {
    const { price, name } = details;

    return (
      <>
        <div className="text-sm flex justify-between mb-1">
          <span className="text-blue">{name}</span>
          <span className="text-gray-500">{price}</span>
        </div>
        <div className="w-full rounded-lg h-1.5 bg-gray-200">
          <div
            className={`rounded-lg h-full transition-all bg-blue`}
            style={{ width: `${price}%` }}
          />
        </div>
      </>
    );
  } else if (!details && volume <= 0) {
    // for markets with no liquidity
    return (
      <>
        <div className="text-sm flex justify-between mb-1">
          <span className="text-gray-500">No liquidity in this market</span>
          <span className="text-gray-500">0%</span>
        </div>
        <div className="w-full rounded-lg h-1.5 bg-gray-200"></div>
      </>
    );
  } else {
    return <Skeleton height={30} width="100%" variant="rect" />;
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
    marketType: { categorical?: string; scalar?: string[] };
  };
}) => {
  return (
    <div>
      <div className="text-xs my-2.5">
        <span className="font-semibold">{rows.outcomes} outcomes</span>
        <span>
          {rows.endDate &&
            ` | Ends ${new Date(Number(rows?.endDate)).toLocaleString("en-US", {
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
            {rows.volume} {rows.baseAsset}
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
  volume,
  baseAsset,
  width,
  tags,
  endDate,
  status,
  className = "",
}: MarketCardProps) => {
  const { data: spotPrices } = useMarketSpotPrices(marketId);
  const getImplied = () => {
    if (spotPrices) {
      const totalAssetPrice = Array.from(spotPrices.values()).reduce(
        (val, cur, index) => val.plus(cur),
        new Decimal(0),
      );
      const assetPrices = outcomes.map((outcome) => {
        return {
          price: Math.round((outcome.price / totalAssetPrice.toNumber()) * 100),
          name: outcome.name,
        };
      });

      const highestAsset = assetPrices.reduce((highest, asset) =>
        highest.price > asset.price ? highest : asset,
      );
      return highestAsset;
    }
  };
  const infoRows = {
    marketType: marketType,
    endDate: endDate,
    outcomes: outcomes.length,
    volume: volume,
    baseAsset: baseAsset?.toUpperCase() ?? "ZTG",
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

  return (
    <MarketCardContext.Provider value={{ baseAsset }}>
      <motion.div
        whileHover={{ opacity: 0.7, background: "white" }}
        whileFocus={{ opacity: 0.5, background: "white" }}
        whileTap={{ opacity: 0.7, background: "white" }}
        data-testid={`marketCard-${marketId}`}
        style={{
          minWidth: width ? width : "100%",
          maxWidth: width ? width : "100%",
        }}
      >
        <div
          className={`flex flex-col w-full h-full bg-anti-flash-white rounded-[10px] p-[15px] relative ${className}`}
        >
          <Link
            href={`/markets/${marketId}`}
            className="flex flex-col flex-1 gap-2.5"
          >
            <div className="flex gap-2.5">
              <MarketImage image={img} alt={question} />
              <div className="flex flex-wrap font-medium">
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
              {/* don't show if market type is scalar */}
              {!marketType?.scalar && (
                <MarketCardPredictionBar
                  volume={volume}
                  details={getImplied()}
                />
              )}
            </div>
            <MarketCardDetails rows={infoRows} />
          </Link>
        </div>
      </motion.div>
    </MarketCardContext.Provider>
  );
};

export default MarketCard;
