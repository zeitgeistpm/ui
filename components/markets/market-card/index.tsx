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
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { useQuery } from "@tanstack/react-query";
import { CATEGORY_IMAGES } from "lib/constants/category-images";
import { seededChoice } from "lib/util/random";
import { useMarketCmsMetadata } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { Transition } from "@headlessui/react";

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
  neoPool?: FullMarketFragment["neoPool"] | null;
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
}: {
  prediction: { name: string; price: number };
}) => {
  // check if market has liquidity
  if (price != null) {
    const impliedPercentage = Math.round(Number(price) * 100);

    return (
      <div className={`relative h-[30px] w-full bg-gray-200 transition-all`}>
        <div className="absolute flex h-full w-full items-center justify-between px-2.5 text-sm">
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
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-500">No liquidity in this market</span>
          <span className="text-gray-500">0%</span>
        </div>
        <div className="h-1.5 w-full rounded-lg bg-gray-100"></div>
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
        {isEnding() && <span className="ml-1 text-red">Ends Soon</span>}
        <span className="ml-1 border-l-1 border-l-black pl-1 font-semibold ">
          {rows.outcomes} outcomes{" "}
        </span>
      </div>
      <div className="ml-auto flex items-center justify-center gap-1.5">
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
  neoPool,
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
        className={`ztg-transition group relative flex min-w-full flex-col  
        rounded-[10px] bg-white p-5 md:min-w-[calc(50%-8px)] md:hover:scale-[1.035] lg:min-w-[calc(100%/3-9.67px)] ${className}`}
      >
        <Link
          href={`/markets/${marketId}`}
          onClick={(e) => {
            if (disableLink) {
              e.preventDefault();
              return;
            }
          }}
          className={`flex flex-1 flex-col gap-4 ${
            disableLink && "cursor-default"
          }`}
        >
          <div className="flex h-[54px] w-full gap-4 whitespace-normal">
            <div className="relative min-h-[54px] min-w-[54px] rounded-xl">
              <Image
                alt={"Market image"}
                src={`/api/market/image/${marketId}`}
                fill
                className="overflow-hidden rounded-lg"
                style={{
                  objectFit: "cover",
                  objectPosition: "50% 50%",
                }}
                sizes={"54px"}
              />
            </div>
            <h5 className="line-clamp-2 h-fit w-full text-base duration-200">
              {question}
            </h5>
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
            ) : (pool || neoPool) && marketType?.categorical ? (
              <MarketCardPredictionBar prediction={prediction} />
            ) : (pool || neoPool) && scalarType ? (
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
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-500">
                    No liquidity in this market
                  </span>
                  <span className="text-gray-500">
                    {lower} - {upper}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-lg bg-gray-200"></div>
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
