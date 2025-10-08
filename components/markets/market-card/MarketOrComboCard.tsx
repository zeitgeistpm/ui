import {
  MarketOrComboItem,
  isMarketItem,
  isComboPoolItem,
} from "lib/types/market-or-combo";
import { MarketCard } from "./index";
import Skeleton from "components/ui/Skeleton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";
import Link from "next/link";
import { BarChart2, Droplet, Users } from "react-feather";
import { parseAssetId } from "@zeitgeistpm/sdk";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import SimpleImage from "components/ui/SimpleImage";
import dynamic from "next/dynamic";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useAmm2Pool } from "lib/hooks/queries/amm2/useAmm2Pool";
import { createVirtualComboMarket } from "lib/utils/createVirtualComboMarket";

const MarketFavoriteToggle = dynamic(() => import("../MarketFavoriteToggle"), {
  ssr: false,
});

export interface MarketOrComboCardProps {
  item: MarketOrComboItem;
  className?: string;
  disableLink?: boolean;
}

export const MarketOrComboCard = ({
  item,
  className = "",
  disableLink,
}: MarketOrComboCardProps) => {
  // If it's a regular market, use the existing MarketCard
  if (isMarketItem(item)) {
    return (
      <MarketCard
        market={item.data}
        liquidity={item.stats.liquidity}
        numParticipants={item.stats.participants}
        className={className}
        disableLink={disableLink}
      />
    );
  }

  // If it's a combo pool, render the combo card
  if (isComboPoolItem(item)) {
    return (
      <ComboPoolCard
        item={item}
        className={className}
        disableLink={disableLink}
      />
    );
  }

  return null;
};

const ComboPoolCard = ({
  item,
  className = "",
  disableLink,
}: {
  item: Extract<MarketOrComboItem, { type: "combo" }>;
  className?: string;
  disableLink?: boolean;
}) => {
  const { data: pool, stats, associatedMarkets, question, baseAsset } = item;
  // Get the earliest end date from associated markets
  const earliestEndDate = associatedMarkets.reduce(
    (earliest, market) => {
      // Parse the timestamp string to number
      const endTime = Number(market.period.end);

      return earliest === null || endTime < earliest ? endTime : earliest;
    },
    null as number | null,
  );

  const hasEnded = earliestEndDate ? hasDatePassed(earliestEndDate) : false;

  const isEnding = () => {
    if (!earliestEndDate) return false;
    const currentTime = new Date();
    const sixHours = 21600000;
    const diff = earliestEndDate - currentTime.getTime();
    return diff < sixHours && diff > 0;
  };

  const assetId = parseAssetId(baseAsset).unwrap();
  const imagePath = lookupAssetImagePath(assetId);

  // Create a truncated question for display
  const displayQuestion =
    question.length > 100 ? `${question.substring(0, 100)}...` : question;

  // Calculate total outcomes from all associated markets
  const totalOutcomes = associatedMarkets.reduce((total, market) => {
    return total + (market.categories?.length || 0);
  }, 0);

  return (
    <div
      data-testid={`comboPoolCard-${pool.poolId}`}
      className={`ztg-transition group relative flex min-w-full flex-col  
      rounded-[10px] bg-white p-5 md:min-w-[calc(50%-8px)] md:hover:scale-[1.015] lg:min-w-[calc(100%/3-9.67px)] ${className}`}
    >
      <Link
        href={item.link}
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
        {/* Market roles section */}
        <div className="flex gap-2 text-xs">
          {associatedMarkets.map((market, index) => {
            const roleLabel = index === 0 ? "Assume" : "Then";
            const roleColor =
              index === 0
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700";
            const marketQuestion =
              market.question.length > 40
                ? `${market.question.substring(0, 40)}...`
                : market.question;

            return (
              <div
                key={market.marketId}
                className="flex-1 rounded border border-gray-200 bg-gray-50 p-2"
              >
                <span className="line-clamp-3 text-xs text-gray-700">
                <span
                  className={`mb-1 rounded mr-1 px-1.5 py-0.5 text-xxs font-semibold ${roleColor}`}
                >
                  {roleLabel}
                </span> {market.question}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full">
          <ComboPoolPredictionBar
            poolId={pool.poolId}
            associatedMarkets={associatedMarkets}
          />
        </div>

        <div className="flex flex-1 gap-2">
          <div className="flex-1">
            <div className="flex items-center text-xs">
              <div>
                <span>
                  {earliestEndDate &&
                    `${hasEnded ? "Ended" : "Ends"} ${new Date(
                      earliestEndDate,
                    ).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`}
                </span>
                {isEnding() && <span className="ml-1 text-red">Ends Soon</span>}
                <span className="ml-1 border-l-1 border-l-black pl-1 font-semibold ">
                  {totalOutcomes} outcomes • {associatedMarkets.length} markets
                </span>
              </div>
              <div className="ml-auto flex items-center justify-center gap-1.5">
                {stats.participants != undefined && baseAsset ? (
                  <div className="flex items-center gap-0.5">
                    <Users size={12} />
                    <span>{formatNumberCompact(stats.participants, 2)}</span>
                  </div>
                ) : (
                  <Skeleton width={30} height={12} />
                )}
                <div className="flex items-center gap-1">
                  <BarChart2 size={12} />
                  <span>
                    {formatNumberCompact(
                      new Decimal(stats.volume).div(ZTG).toNumber(),
                      2,
                    )}
                  </span>
                </div>
                {stats.liquidity != undefined && baseAsset ? (
                  <div className="flex items-center gap-1">
                    <Droplet size={12} />
                    <span>
                      {formatNumberCompact(
                        new Decimal(stats.liquidity).div(ZTG).toNumber(),
                        2,
                      )}
                    </span>
                  </div>
                ) : (
                  <Skeleton width={30} height={12} />
                )}
                <SimpleImage
                  src={imagePath}
                  alt="Currency token logo"
                  className="rounded-full"
                  style={{ width: "12px", height: "12px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const ComboPoolPredictionBar = ({
  poolId,
  associatedMarkets,
}: {
  poolId: number;
  associatedMarkets: any[];
}) => {
  // Get pool data to create virtual market
  const { data: poolData } = useAmm2Pool(0, poolId);

  // Create virtual market for spot price queries
  const virtualMarket =
    poolData && associatedMarkets.length > 0
      ? createVirtualComboMarket(poolId, poolData, associatedMarkets)
      : undefined;

  // Get spot prices for the combo pool
  const { data: spotPrices } = useMarketSpotPrices(poolId, 0, virtualMarket);

  if (!spotPrices || spotPrices.size === 0) {
    return (
      <>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-500">No liquidity in this pool</span>
          <span className="text-gray-500">0%</span>
        </div>
        <div className="h-1.5 w-full rounded-lg bg-gray-100"></div>
      </>
    );
  }

  // Calculate total asset price (sum of all spot prices)
  const totalAssetPrice = Array.from(spotPrices.values()).reduce(
    (val, cur) => val.plus(cur),
    new Decimal(0),
  );

  // Find the outcome with the highest implied percentage
  let highestPrice = new Decimal(0);
  let highestIndex = 0;
  let highestPercentage = 0;

  spotPrices.forEach((price, index) => {
    if (price.gt(highestPrice)) {
      highestPrice = price;
      highestIndex = index;
    }
  });

  if (totalAssetPrice.gt(0)) {
    highestPercentage = Math.round(
      highestPrice.div(totalAssetPrice).toNumber() * 100,
    );
  }

  // Create a name for the leading outcome using actual combination names
  const leadingOutcomeName =
    virtualMarket?.categories?.[highestIndex]?.name ||
    `Combination ${highestIndex + 1}`;

  return (
    <div className={`relative h-[30px] w-full bg-gray-200 transition-all`}>
      <div className="absolute flex h-full w-full items-center justify-between px-2.5 text-sm">
        <span className="line-clamp-1 text-purple-600">
          {leadingOutcomeName}
        </span>
        <span className="text-purple-600 transition-all">
          {highestPercentage}%
        </span>
      </div>
      <div
        className={`h-full bg-purple-200`}
        style={{
          width: `${isNaN(highestPercentage) ? 0 : highestPercentage}%`,
        }}
      />
    </div>
  );
};

export default MarketOrComboCard;
