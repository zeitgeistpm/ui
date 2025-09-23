import { MarketOrComboItem, isMarketItem, isComboPoolItem } from "lib/types/market-or-combo";
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
  console.log(question)
  // Get the earliest end date from associated markets
  const earliestEndDate = associatedMarkets.reduce((earliest, market) => {
    // Parse the timestamp string to number
    const endTime = Number(market.period.end);
    
    return earliest === null || endTime < earliest ? endTime : earliest;
  }, null as number | null);

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
  const displayQuestion = question.length > 100 ? `${question.substring(0, 100)}...` : question;
  
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
        <div className="flex h-[54px] w-full gap-4 whitespace-normal">
          <div className="absolute right-4 top-4">
            <MarketFavoriteToggle marketId={pool.poolId} />
          </div>
          
          {/* Combo pool indicator with overlapping market icons */}
          <div className="relative min-h-[54px] min-w-[54px] rounded-lg bg-gradient-to-br from-purple-400 to-blue-500">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">MULTI</span>
            </div>
            {/* Small indicator showing number of markets */}
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              {associatedMarkets.length}
            </div>
          </div>
          
          <h5 className="line-clamp-3 h-fit w-full pr-4 text-sm font-semibold duration-200 whitespace-pre-line">
            {displayQuestion}
          </h5>
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
                    `${hasEnded ? "Ended" : "Ends"} ${new Date(earliestEndDate).toLocaleString("en-US", {
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
                    {formatNumberCompact(new Decimal(stats.volume).div(ZTG).toNumber(), 2)}
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
  const virtualMarket = poolData && associatedMarkets.length > 0 
    ? createVirtualComboMarket(poolId, poolData, associatedMarkets)
    : undefined;

  // Get spot prices for the combo pool
  const { data: spotPrices } = useMarketSpotPrices(poolId, 0, virtualMarket);
  
  console.log(`Combo Pool Debug for Pool ${poolId}:`, {
    poolId,
    poolData: poolData ? { 
      poolId: poolData.poolId, 
      assetIds: poolData.assetIds?.length,
      liquidity: poolData.liquidity?.toString()
    } : null,
    spotPrices: spotPrices ? Array.from(spotPrices.entries()) : null,
    virtualMarketId: virtualMarket?.marketId,
    virtualMarketQuestion: virtualMarket?.question,
    virtualMarketCategories: virtualMarket?.categories?.map(c => c.name),
    associatedMarkets: associatedMarkets.map(m => ({ 
      marketId: m.marketId,
      question: m.question, 
      categories: m.categories?.map(c => c.name) 
    }))
  });
  
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
      (highestPrice.div(totalAssetPrice).toNumber()) * 100
    );
  }

  // Create a name for the leading outcome using actual combination names
  const leadingOutcomeName = virtualMarket?.categories?.[highestIndex]?.name || `Combination ${highestIndex + 1}`;
  
  console.log('Prediction calculation:', {
    highestIndex,
    highestPrice: highestPrice.toString(),
    totalAssetPrice: totalAssetPrice.toString(),
    highestPercentage,
    leadingOutcomeName,
    allPrices: Array.from(spotPrices.entries()).map(([index, price]) => ({
      index, 
      price: price.toString(),
      percentage: totalAssetPrice.gt(0) ? Math.round((price.div(totalAssetPrice).toNumber()) * 100) : 0
    }))
  });

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