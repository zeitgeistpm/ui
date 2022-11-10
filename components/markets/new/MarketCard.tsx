import Image from "next/image";
import { useState } from "react";
import { MoreVertical, X } from "react-feather";

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

type MarketCategory = { ticker: string; color: string };
type MarketCategories = MarketCategory[];

type MarketCardOverlayCategoryProps = {
  category: MarketCategory;
  className?: string;
};

const MarketCardOverlayCategory = ({
  category,
  className = "",
}: MarketCardOverlayCategoryProps) => {
  return (
    <div className={"flex flex-row h-[35px] flex-shrink-0 " + className}>
      <div
        className="w-[20px] h-[20px] rounded-full border-sky-600 border-[2px]"
        style={{ backgroundColor: `${category.color}` }}
      ></div>
      <div className="flex flex-col w-[95px] flex-shrink-0 ml-[7px]">
        <div className="font-lato font-bold uppercase text-ztg-14-110 truncate h-[17px] flex-shrink-0">
          {category.ticker}
        </div>
        {/* TODO: make a component for price diff */}
        <div className="h-full flex flex-row items-center">
          <div
            className="mr-[5px]"
            style={{
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "10px solid #E90303",
            }}
          ></div>
          <div className="font-mono text-ztg-10-150">0.5%</div>
        </div>
      </div>
    </div>
  );
};

const MarketCardOverlayCategories = ({
  categories,
}: {
  categories: MarketCategories;
}) => {
  const numCategories = categories.length;
  return (
    <div className="flex flex-col h-[215px] overflow-y-scroll">
      {categories.map((cat, idx) => {
        const botMargin = idx === numCategories - 1 ? "mb-0" : "mb-[25px]";
        return (
          <MarketCardOverlayCategory
            key={`cat-${idx}`}
            category={cat}
            className={botMargin}
          />
        );
      })}
    </div>
  );
};

type MarketCardOverlayProps = {
  categories: MarketCategories;
  className?: string;
  onCloseIconClick?: () => void;
};

const MarketCardOverlay = ({
  categories,
  className = "",
  onCloseIconClick,
}: MarketCardOverlayProps) => {
  return (
    <div
      className={
        "w-full h-[367px] absolute bg-white z-ztg-20 rounded-[10px] shadow-ztg-5 p-[16px] " +
        className
      }
    >
      <div className="flex flex-col mb-[25px]">
        <div className="flex flex-row justify-between">
          <div className="font-lato font-bold text-ztg-16-150">
            {categories.length} Outcomes
          </div>
          <X
            onClick={onCloseIconClick}
            className="cursor-pointer text-sky-600"
            size={24}
          />
        </div>
        <div className="flex flex-row items-center h-[26px] text-ztg-12-150 text-sky-600">
          Showing 1-4
        </div>
      </div>
      <MarketCardOverlayCategories categories={categories} />
    </div>
  );
};

export type MarketCardProps = {
  marketId: number;
  img?: string;
  question: string;
  status: string;
  categories: MarketCategories;
  prediction: string;
  volume: number;
  className?: string;
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
        <div className="h-[60px] w-[60px] mr-[15px] flex-grow flex-shrink-0 relative z-ztg-10">
          <Image
            src={img ?? "/icons/default-market.png"}
            className="rounded-full bg-white"
            width={60}
            layout="fill"
            quality={100}
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
