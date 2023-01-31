import Link from "next/link";
import React, { useState } from "react";
import { Skeleton } from "@material-ui/lab";
import MarketImage from "components/ui/MarketImage";
import { MarketOutcomes } from "lib/types/markets";
import MarketCardOverlay from "./overlay";
import MarketCardContext from "./context";
import { motion } from "framer-motion";
import Decimal from "decimal.js";
import { Users, BarChart2, Droplet } from "react-feather";

import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { assetPrefix } from "next.config";

export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  outcomes: MarketOutcomes;
  prediction: string;
  volume: number;
  baseAsset: string;
  tags: string[];
  endDate: string;
}

export interface MarketCardProps extends IndexedMarketCardData {
  className?: string;
  width?: number;
}

const MarketCardInfoRow = ({
  name,
  value,
}: {
  name: string;
  value?: string;
}) => {
  return (
    <div className="">
      <span className="text-sky-600">{name}:</span>{" "}
      {value == null ? (
        <Skeleton
          height={15}
          width={125}
          classes={{ root: "!bg-sky-600" }}
          className="!transform-none !inline-block"
        />
      ) : (
        <span className="text-black">{value}</span>
      )}
    </div>
  );
};

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
    <span className={`px-2.5 py-0.5 h-fit text-xs rounded ${classes}`}>
      {value}
    </span>
  );
};

const MarketCardTags = ({ tags }: { tags: string[] }) => {
  return (
    <>
      {" "}
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

const MarketCardDetails = ({
  rows,
}: {
  rows: {
    getImplied: () => { price: number; color: string; name: string };
    volume: string;
    outcomes: number;
    endDate: string;
  };
}) => {
  if (rows.getImplied()) {
    const { price, color, name } = rows.getImplied();
    return (
      <div className="w-full">
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
        <div className="text-xs my-2.5">
          <span className="font-semibold">{rows.outcomes} outcomes</span>
          <span>
            {rows.endDate &&
              ` | Ends ${new Date(Number(rows?.endDate)).toLocaleString(
                "en-US",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                },
              )}`}
          </span>
        </div>
        <div className="flex gap-2.5 text-sm">
          {/* <div className="flex items-center gap-2">
            <Users size={18} />
            <span>223</span>
          </div> */}
          <div className="flex items-center gap-2">
            <BarChart2 size={18} />
            <span>{rows.volume}</span>
          </div>
          {/* <div className="flex items-center gap-2">
            <Droplet size={18} />
            <span>223K ZTG</span>
          </div> */}
        </div>
      </div>
    );
  } else {
    <Skeleton variant="rect" />;
  }
};

/*TODO:
- ending soon: what is considered "soon"? (less than 6hrs)
- verified: what is that?
- percenatges of each outcome
- Math.round((currentPrice / totalAssetPrice.toNumber()) * 100,)
- end date
- liquidity
*/
const MarketCard = ({
  marketId,
  img,
  question,
  creation,
  outcomes,
  prediction,
  volume,
  baseAsset,
  width,
  tags,
  endDate,
  className = "",
}: MarketCardProps) => {
  const [showDetailsOverlay, setShowDetailsOverlay] = useState<boolean>(false);

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
          color: outcome.color,
        };
      });

      const highestAsset = assetPrices.reduce((highest, asset) =>
        highest.price > asset.price ? highest : asset,
      );
      return highestAsset;
      // if (highestAsset.price > 0 && highestAsset.price < 100) {
      //   return highestAsset;
      // } else {
      //   return {price: }
      // }
    }
  };
  const infoRows = {
    // { name: "Prediction", value: prediction },
    getImplied: getImplied,
    endDate: endDate,
    outcomes: outcomes.length,
    volume: `${volume ?? 0} ${baseAsset?.toUpperCase() ?? "ZTG"}`,
    // { name: "Status", value: creation },
  };
  const isEnding = () => {
    const currentTime = new Date();
    const endTime = Number(infoRows.endDate);
    //6 hours in milliseconds
    const sixHours = 21600000;
    const diff = endTime - currentTime.getTime();
    //checks if event has passed and is within 6 hours
    return diff < sixHours && diff > 0 ? true : false;
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
          className={`flex flex-col justify-center w-full h-full bg-anti-flash-white rounded-[10px] p-[15px] relative ${className}`}
        >
          {showDetailsOverlay && (
            <MarketCardOverlay
              marketId={marketId}
              outcomes={outcomes}
              className="top-0 left-[0]"
              onCloseIconClick={() => setShowDetailsOverlay(false)}
            />
          )}
          {/* {outcomes?.length > 0 && (
            <MoreVertical
              className="absolute right-[10px] text-pastel-blue cursor-pointer"
              onClick={() => setShowDetailsOverlay(true)}
            />
          )} */}
          <Link href={`/markets/${marketId}`} className="flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              <MarketImage image={img} alt={question} />
              <div className="flex flex-wrap gap-2.5 font-medium">
                <MarketCardTags tags={tags} />
                {isEnding() && (
                  <Pill value="Ends Soon" classes="bg-red-light text-red" />
                )}
                <Pill
                  value="&#x2713; Verified"
                  classes="bg-green-light text-green"
                />
              </div>
            </div>
            <MarketCardInfo question={question} />
            <MarketCardDetails rows={infoRows} />
          </Link>
        </div>
      </motion.div>
    </MarketCardContext.Provider>
  );
};

export default MarketCard;
