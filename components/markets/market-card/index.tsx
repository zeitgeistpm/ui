import Link from "next/link";
import React, { useState } from "react";
import { Skeleton } from "@material-ui/lab";
import MarketImage from "components/ui/MarketImage";
import { MarketOutcomes } from "lib/types/markets";
import MarketCardOverlay from "./overlay";
import MarketCardContext from "./context";
import { motion } from "framer-motion";

export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  outcomes: MarketOutcomes;
  prediction: string;
  volume: number;
  baseAsset: string;
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

const MarketCardInfo = ({
  rows,
  question,
}: {
  rows: { name: string; value: string }[];
  question: string;
}) => {
  return (
    <div className="pl-[15px] w-full h-full flex flex-col justify-center text-ztg-14-165 whitespace-normal">
      <h5 className="black font-medium w-full h-fit">{question}</h5>
      {rows.map((r, idx) => (
        <MarketCardInfoRow {...r} key={idx} />
      ))}
    </div>
  );
};

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
  className = "",
}: MarketCardProps) => {
  const [showDetailsOverlay, setShowDetailsOverlay] = useState<boolean>(false);

  const infoRows = [
    { name: "Prediction", value: prediction },
    {
      name: "Volume",
      value: `${volume ?? 0} ${baseAsset?.toUpperCase() ?? "ZTG"}`,
    },
    // { name: "Status", value: creation },
  ];

  return (
    <MarketCardContext.Provider value={{ baseAsset }}>
      <motion.div
        whileHover={{ opacity: 0.3, background: "white" }}
        whileFocus={{ opacity: 0.5, background: "white" }}
        whileTap={{ opacity: 0.3, background: "white" }}
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
          <Link href={`/markets/${marketId}`} className="flex items-center">
            <MarketImage image={img} alt={question} />
            <MarketCardInfo question={question} rows={infoRows} />
          </Link>
        </div>
      </motion.div>
    </MarketCardContext.Provider>
  );
};

export default MarketCard;
