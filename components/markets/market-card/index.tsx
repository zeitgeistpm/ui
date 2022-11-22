import Link from "next/link";
import React, { useState, useEffect } from "react";
import { MoreVertical } from "react-feather";
import MarketImage from "components/ui/MarketImage";
import MarketCardOverlay from "./overlay";
import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import { useOutcomePrices } from "lib/hooks/queries/useOutcomePrices";
import { useMarketPrediction } from "lib/hooks/queries/useMarketPrediction";
import { useMarketOutcomes } from "lib/hooks/queries/useMarketOutcomes";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { Skeleton } from "@material-ui/lab";

export type MarketCategory = {
  name?: string;
  color?: string;
  assetId?: AssetId;
  ticker?: string;
};
export type MarketCategories = MarketCategory[];

export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  categories?: MarketCategories;
  prediction?: string;
  volume?: number;
  baseAsset?: string;
}

export interface MarketCardProps extends IndexedMarketCardData {
  className?: string;
}

const MarketCardInfoRow = ({
  name,
  value,
}: {
  name: string;
  value: string;
}) => {
  return (
    <div className="h-[18px]">
      <span className="text-sky-600">{name}:</span>{" "}
      {value == null ? (
        <Skeleton
          height={15}
          width={100}
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
}: {
  rows: { name: string; value: string }[];
}) => {
  return (
    <div className="w-full h-full flex flex-col font-lato justify-between text-ztg-12-120 mt-[10px]">
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
  categories,
  prediction,
  volume,
  baseAsset,
  className = "",
}: MarketCardProps) => {
  const [showDetailsOverlay, setShowDetailsOverlay] = useState<boolean>(false);

  const predictionAsync = useMarketPrediction({ marketId }, 12000);

  const infoRows = [
    { name: "Prediction", value: prediction || predictionAsync },
    { name: "Volume", value: `${volume} ${baseAsset?.toUpperCase() ?? "ZTG"}` },
    { name: "Status", value: creation },
  ];

  return (
    <div
      className={
        "w-full h-full bg-anti-flash-white rounded-[10px] p-[15px] flex flex-col relative " +
        className
      }
    >
      {showDetailsOverlay && (
        <MarketCardOverlay
          marketId={marketId}
          categories={categories}
          className="top-0 left-[0]"
          onCloseIconClick={() => setShowDetailsOverlay(false)}
        />
      )}
      {categories?.length > 0 && (
        <MoreVertical
          className="absolute right-[10px] text-pastel-blue cursor-pointer"
          onClick={() => setShowDetailsOverlay(true)}
        />
      )}
      <Link href={`/markets/${marketId}`} className="flex flex-row mr-[17px]">
        <MarketImage image={img} alt={question} />
        <div className="ml-[15px] black font-lato font-bold h-[75px] w-full line-clamp-3 text-ztg-14-150">
          {question}
        </div>
      </Link>
      <MarketCardInfo rows={infoRows} />
    </div>
  );
};

export default MarketCard;
