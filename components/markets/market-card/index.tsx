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
  rows: { volume: string; outcomes: number; endDate: string };
}) => {
  console.log(rows.endDate);
  return (
    <div className="w-full">
      <div className="text-sm flex justify-between mb-1">
        <span className="text-blue">New York</span>
        <span className="text-gray-500">75%</span>
      </div>
      <div className="w-full rounded-lg h-1.5 bg-gray-200">
        <div
          className="rounded-lg h-full transition-all bg-blue"
          style={{ width: `75%` }}
        />
      </div>
      <div className="text-xs my-2.5">
        <span className="font-semibold">{rows.outcomes} outcomes</span>
        {/* <span> | </span> */}
        <span>
          {rows.endDate &&
            ` | ${new Date(Number(rows?.endDate)).toISOString()}`}
        </span>
        {/* {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
          }).format(Number(indexedMarket.period.end))} */}
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
  const infoRows = {
    // { name: "Prediction", value: prediction },
    endDate: endDate,
    outcomes: outcomes.length,
    volume: `${volume ?? 0} ${baseAsset?.toUpperCase() ?? "ZTG"}`,
    // { name: "Status", value: creation },
  };

  // const { data: market } = useMarket(marketId);
  // const { data: spotPrices } = useMarketSpotPrices(marketId);

  // if (spotPrices) {
  //   const totalAssetPrice = Array.from(spotPrices.values()).reduce(
  //     (val, cur) => val.plus(cur),
  //     new Decimal(0),
  //   );
  //   console.log(totalAssetPrice.toNumber());

  //   const currentPrice = spotPrices.get(index).toNumber();
  // }

  // console.log(market);

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
                <Pill value="Ends Soon" classes="bg-red-light text-red" />
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
