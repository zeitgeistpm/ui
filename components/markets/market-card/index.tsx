import Image from "next/image";
import React, { useState } from "react";
import { MoreVertical } from "react-feather";
import MarketCardOverlay from "./overlay";
import { MarketCategories } from "./overlay-categories";

export type MarketCardProps = {
  marketId: number;
  img?: string;
  question: string;
  status: string;
  categories: MarketCategories;
  prediction?: string;
  volume: number;
  className?: string;
};

const MarketCardInfoRow = ({
  name,
  value,
}: {
  name: string;
  value: string;
}) => {
  return (
    <div className="h-[18px]">
      <span className="text-sky-600 font-semibold">{name}:</span>{" "}
      <span className="text-black font-bold">{value}</span>
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
  status,
  categories,
  prediction,
  volume,
  className = "",
}: MarketCardProps) => {
  const [showDetailsOverlay, setShowDetailsOverlay] = useState<boolean>(false);

  const infoRows = [
    { name: "Prediction", value: prediction },
    { name: "Volume", value: `${volume} ZTG` },
    { name: "Status", value: status },
  ];
  return (
    <div
      className={
        "w-full h-[175px] bg-anti-flash-white rounded-[10px] p-[15px] flex flex-col relative " +
        className
      }
    >
      {showDetailsOverlay && (
        <MarketCardOverlay
          categories={categories}
          className="top-0 left-[0]"
          onCloseIconClick={() => setShowDetailsOverlay(false)}
        />
      )}
      <MoreVertical
        className="absolute right-[10px] text-pastel-blue cursor-pointer"
        onClick={() => setShowDetailsOverlay(true)}
      />
      <div className="flex flex-row">
        <div className="h-[60px] w-[60px] mr-[15px] flex-grow flex-shrink-0 relative z-ztg-4">
          <Image
            src={img ?? "/icons/default-market.png"}
            className="rounded-full bg-white"
            width={60}
            height={60}
            quality={100}
            alt={`Image depicting ${question}`}
          />
        </div>
        <div className="mr-[17px] black font-lato font-bold h-[75px] w-full">
          {question}
        </div>
      </div>
      <MarketCardInfo rows={infoRows} />
    </div>
  );
};

export default MarketCard;
