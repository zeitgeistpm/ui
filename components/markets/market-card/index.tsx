import Link from "next/link";
import React, { useEffect, useState } from "react";
import { MoreVertical } from "react-feather";
import { Skeleton } from "@material-ui/lab";
import MarketImage from "components/ui/MarketImage";
import MarketCardOverlay from "./overlay";
import { useMarketOutcomes } from "../MarketsListContext";

export type MarketCategory = {
  name?: string;
  color?: string;
  assetId?: string;
  ticker?: string;
};
export type MarketCategories = MarketCategory[];

export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  categories: MarketCategories;
  prediction?: string;
  volume: number;
  baseAsset: string;
}

export interface MarketCardProps extends IndexedMarketCardData {
  className?: string;
}

const MarketCardInfoRow = ({
  name,
  value,
}: {
  name: string;
  value?: string;
}) => {
  return (
    <div className="h-[18px]">
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
  const [predictionAsync, setPredictionAsync] = useState<string>();

  const outcomes = useMarketOutcomes(marketId);

  useEffect(() => {
    if (outcomes == null) {
      return;
    }
    const sortedByPrice = [...outcomes].sort((a, b) => b.price - a.price);
    setPredictionAsync(sortedByPrice[0].name);
  }, [outcomes]);

  const infoRows = [
    { name: "Prediction", value: predictionAsync ?? prediction },
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
          categories={outcomes ?? categories}
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
