import type { ScalarRangeType } from "@zeitgeistpm/sdk";
import Skeleton from "components/ui/Skeleton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { MarketOutcomes } from "lib/types/markets";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";
import Link from "next/link";
import { BarChart2, Droplet, Users } from "react-feather";
import ScalarPriceRange from "../ScalarPriceRange";
import MarketCardContext from "./context";

import {
  IOBaseAssetId,
  IOForeignAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import Image from "next/image";

export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  creator: string;
  outcomes: MarketOutcomes;
  marketType: MarketType;
  scalarType: ScalarRangeType | null;
  prediction: { name: string; price: number };
  volume: number;
  pool?: { poolId?: number; volume: string } | null;
  baseAsset: string;
  tags?: string[];
  status: string;
  endDate: string;
  liquidity?: string;
  numParticipants?: number;
}

export interface MarketType {
  categorical?: string;
  scalar?: string[];
}

export interface MarketCardProps extends IndexedMarketCardData {
  className?: string;
  disableLink?: boolean;
}

const MarketCardPredictionBar = ({
  prediction: { name, price },
  pool,
}: {
  prediction: { name: string; price: number };
  pool: {};
}) => {
  // check if market has liquidity
  if (Object.keys(pool).length !== 0) {
    const impliedPercentage = Math.round(Number(price) * 100);

    return (
      <div className={`w-full h-[30px] transition-all bg-gray-200 relative`}>
        <div className="text-sm flex justify-between items-center absolute w-full h-full px-2.5">
          <span className="text-blue">{name}</span>
          <span className="text-blue transition-all">{impliedPercentage}%</span>
        </div>
        <div
          className={`h-full bg-blue-lighter`}
          style={{
            width: `${isNaN(impliedPercentage) ? 0 : impliedPercentage}%`,
          }}
        />
      </div>
    );
  } else {
    return (
      <>
        <div className="text-sm flex justify-between mb-1">
          <span className="text-gray-500">No liquidity in this market</span>
          <span className="text-gray-500">0%</span>
        </div>
        <div className="w-full rounded-lg h-1.5 bg-gray-100"></div>
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
  const isEnding = () => {
    const currentTime = new Date();
    const endTime = Number(rows.endDate);
    //6 hours in milliseconds
    const sixHours = 21600000;
    const diff = endTime - currentTime.getTime();
    //checks if event has passed and is within 6 hours
    return diff < sixHours && diff > 0 ? true : false;
  };

  const assetId = parseAssetId(rows.baseAsset).unwrap();
  const imagePath = IOForeignAssetId.is(assetId)
    ? lookupAssetImagePath(assetId.ForeignAsset)
    : IOBaseAssetId.is(assetId)
    ? lookupAssetImagePath(assetId.Ztg)
    : "";

  return (
    <div className="flex items-center text-xs">
      <div>
        <span>
          {rows.endDate &&
            `${rows.hasEnded ? "Ended" : "Ends"} ${new Date(
              Number(rows?.endDate),
            ).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
            })}`}
        </span>
        {isEnding() && <span className="text-red ml-1">Ends Soon</span>}
        <span className="font-semibold border-l-1 border-l-black pl-1 ml-1 ">
          {rows.outcomes} outcomes{" "}
        </span>
      </div>
      <div className="flex gap-1.5 ml-auto items-center justify-center">
        {rows.numParticipants != undefined && rows.baseAsset ? (
          <div className="flex items-center gap-0.5">
            <Users size={12} />
            <span>{formatNumberCompact(rows.numParticipants, 2)}</span>
          </div>
        ) : (
          <Skeleton width={30} height={12} />
        )}
        <div className="flex items-center gap-1">
          <BarChart2 size={12} />
          <span>{formatNumberCompact(rows.volume, 2)}</span>
        </div>
        {rows.liquidity != undefined && rows.baseAsset ? (
          <div className="flex items-center gap-1">
            <Droplet size={12} />
            <span>
              {formatNumberCompact(
                new Decimal(rows.liquidity).div(ZTG).toNumber(),
                2,
              )}
            </span>
          </div>
        ) : (
          <Skeleton width={30} height={12} />
        )}
        <Image
          width={12}
          height={12}
          src={imagePath}
          alt="Currency token logo"
          className="rounded-full"
        />
      </div>
    </div>
  );
};

export const MarketCard = ({
  marketId,
  img,
  question,
  outcomes,
  marketType,
  prediction,
  pool,
  scalarType,
  volume,
  baseAsset,
  endDate,
  status,
  className = "",
  liquidity,
  numParticipants,
  tags,
  disableLink,
}: MarketCardProps) => {
  const isYesNoMarket =
    outcomes.length === 2 &&
    outcomes.some((outcome) => outcome.name.toLowerCase() === "yes") &&
    outcomes.some((outcome) => outcome.name.toLowerCase() === "no");

  //always show "Yes" prediction percentage
  prediction =
    isYesNoMarket === true && prediction.name.toLowerCase() === "no"
      ? { price: 1 - prediction.price, name: "Yes" }
      : prediction;

  const infoRows = {
    marketType: marketType,
    endDate: endDate,
    hasEnded: hasDatePassed(Number(endDate)),
    outcomes: outcomes.length,
    volume: volume,
    baseAsset: baseAsset,
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
        data-testid={`marketCard-${marketId}`}
        className={`group flex flex-col min-w-full md:min-w-[calc(50%-8px)] lg:min-w-[calc(100%/3-9.67px)]  
        rounded-[10px] p-5 relative bg-white ztg-transition md:hover:scale-[1.035] ${className}`}
      >
        <Link
          href={`/markets/${marketId}`}
          onClick={(e) => {
            if (disableLink) {
              e.preventDefault();
              return;
            }
          }}
          className={`flex flex-col flex-1 gap-4 ${
            disableLink && "cursor-default"
          }`}
        >
          <div className="w-full h-full flex whitespace-normal gap-4">
            <h5 className="w-full h-fit line-clamp-2 text-base">{question}</h5>
            {/* {disable for now until we can get image from CMS} */}
            {/* <div className="relative min-w-[84px] min-h-[80px] rounded-xl">
              <MarketImage tags={tags} alt={question} className="rounded-lg" />
            </div> */}
          </div>

          <div className="w-full">
            {status === "Resolved" ? (
              <span className="text-xs text-ztg-blue">
                Resolved:{" "}
                <span className="font-semibold">
                  {marketType?.categorical
                    ? prediction.name
                    : formatNumberCompact(Number(prediction.name))}
                </span>
              </span>
            ) : pool && marketType?.categorical ? (
              <MarketCardPredictionBar pool={pool} prediction={prediction} />
            ) : pool && scalarType && Object.keys(pool).length !== 0 ? (
              <ScalarPriceRange
                scalarType={scalarType}
                lowerBound={lower}
                upperBound={upper}
                shortPrice={outcomes[1].price}
                longPrice={outcomes[0].price}
                status={status}
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
