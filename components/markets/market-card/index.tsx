import Link from "next/link";
import React from "react";
import MarketImage from "components/ui/MarketImage";
import { MarketOutcomes } from "lib/types/markets";
import MarketCardContext from "./context";
import ScalarPriceRange from "../ScalarPriceRange";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { Users, BarChart2, Droplet } from "react-feather";
import { formatNumberCompact } from "lib/util/format-compact";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import Skeleton from "components/ui/Skeleton";
import { hasDatePassed } from "lib/util/hasDatePassed";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { UserIdentity } from "../MarketHeader";
import Image from "next/image";
import CATEGORIES from "../../front-page/PopularCategories";
export interface IndexedMarketCardData {
  marketId: number;
  img?: string;
  question: string;
  creation: string;
  creator: string;
  outcomes: MarketOutcomes;
  marketType: { categorical?: string; scalar?: string[] };
  scalarType: ScalarRangeType;
  prediction: { name: string; price: number };
  volume: number;
  pool: {};
  baseAsset: string;
  tags?: string[];
  status: string;
  endDate: string;
  liquidity?: string;
  numParticipants?: number;
}
export interface MarketCardProps extends IndexedMarketCardData {
  className?: string;
}

const Pill = ({ value, classes }: { value: string; classes: string }) => {
  return (
    <span className={`px-2.5 py-0.5 h-fit text-xs rounded ${classes}`}>
      {value}
    </span>
  );
};

const MarketCardInfo = ({
  question,
  img,
}: {
  question: string;
  img: string;
}) => {
  return (
    <div className="w-full h-full flex whitespace-normal gap-4">
      <h5 className="font-semibold w-full h-fit line-clamp-3 text-base">
        {question}
      </h5>
      {img && <MarketImage image={img} alt={question} className="rounded-lg" />}
    </div>
  );
};

const MarketCardTags = ({
  tags,
  baseAsset,
  isVerified,
}: {
  tags: string[];
  baseAsset: string;
  isVerified: boolean;
}) => {
  return (
    <>
      {/* update later to include other assets */}
      {baseAsset === "Ztg" ? (
        <Image width={20} height={20} src="/currencies/ztg.svg" alt="ZTG" />
      ) : (
        <Image
          width={20}
          height={20}
          src="/category/dotsama.png"
          alt="DOT"
          className="rounded-full"
        />
      )}
      {/* replace later when court dispute mechanism is ready */}
      {/* {tags?.map((tag, index) => {
        return (
          tag === "Politics" && (
            <Image
              key={index}
              width={20}
              height={20}
              src="icons/politics-cat-icon.svg"
              alt="politics"
            />
          )
        );
      })} */}
      {isVerified && (
        <Image width={20} height={20} src="icons/verified-icon.svg" alt="" />
      )}
    </>
  );
};

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
      <div
        className={`w-full h-[30px] transition-all group-hover:bg-white bg-gray-200 relative`}
      >
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
  return (
    <div>
      <div className="text-xs mb-4">
        <span className="font-semibold">{rows.outcomes} outcomes</span>
        <span>
          {rows.endDate &&
            ` | ${rows.hasEnded ? "Ended" : "Ends"} ${new Date(
              Number(rows?.endDate),
            ).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}`}
        </span>
        {isEnding() && (
          <span>
            {" "}
            | <span className="text-red">Ends Soon</span>
          </span>
        )}
      </div>
      <div className="flex gap-2.5 text-sm min-w-full">
        {rows.numParticipants != undefined && rows.baseAsset ? (
          <div className="flex items-center gap-2">
            <Users size={18} />
            <span>{rows.numParticipants}</span>
          </div>
        ) : (
          <Skeleton width={35} height={20} />
        )}
        <div className="flex items-center gap-2">
          <BarChart2 size={18} />
          <span>
            {formatNumberCompact(rows.volume)} {rows.baseAsset}
          </span>
        </div>
        {rows.liquidity != undefined && rows.baseAsset ? (
          <div className="flex items-center gap-2">
            <Droplet size={18} />
            <span>
              {formatNumberCompact(
                new Decimal(rows.liquidity).div(ZTG).toString(),
              )}{" "}
              {rows.baseAsset}
            </span>
          </div>
        ) : (
          <Skeleton width={120} height={20} />
        )}
      </div>
    </div>
  );
};

const MarketCard = ({
  marketId,
  img,
  question,
  creation,
  creator,
  outcomes,
  marketType,
  prediction,
  pool,
  scalarType,
  volume,
  baseAsset,
  tags = [],
  endDate,
  status,
  className = "",
  liquidity,
  numParticipants,
}: MarketCardProps) => {
  const isVerified = () => {
    return creation === "Advised" && status === "Active" ? true : false;
  };
  const isProposed = () => {
    return creation === "Advised" && status === "Proposed" ? true : false;
  };
  const { data: metadata } = useAssetMetadata(parseAssetIdString(baseAsset));

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
    baseAsset: metadata?.symbol ?? "",
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
        className={`group flex flex-col min-w-full md:min-w-[calc(50%-14px)] lg:min-w-[calc(100%/3-18.67px)] min-h-[290px] h-[274px] rounded-[10px] p-[15px] relative bg-anti-flash-white hover:bg-pastel-blue ${className}`}
      >
        <Link
          href={`/markets/${marketId}`}
          className="flex flex-col flex-1 gap-4"
        >
          <div className="flex justify-between gap-2.5 w-full">
            {creator && (
              <UserIdentity user={creator} className="text-xs gap-2.5" />
            )}
            <div className="flex flex-wrap gap-2.5 font-medium h-fit">
              <MarketCardTags
                baseAsset={baseAsset}
                tags={tags}
                isVerified={isVerified()}
              />
            </div>
          </div>
          <MarketCardInfo question={question} img={img} />
          <div className="w-full">
            {pool && marketType?.categorical ? (
              <MarketCardPredictionBar pool={pool} prediction={prediction} />
            ) : pool && Object.keys(pool).length !== 0 ? (
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
