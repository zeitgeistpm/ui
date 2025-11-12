import { MarketStage, parseAssetId } from "@zeitgeistpm/sdk";
import CourtStageTimer from "components/court/CourtStageTimer";
import Modal from "components/ui/Modal";
import Skeleton from "components/ui/Skeleton";
import Decimal from "decimal.js";
import { PromotedMarket } from "lib/cms/get-promoted-markets";
import { BLOCK_TIME_SECONDS, ZTG } from "lib/constants";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useMarketCaseId } from "lib/hooks/queries/court/useMarketCaseId";
import { useMarketEventHistory } from "lib/hooks/queries/useMarketEventHistory";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { usePoolStats } from "lib/hooks/queries/usePoolStats";
import { useMarketImage } from "lib/hooks/useMarketImage";
import { MarketReport } from "lib/types";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import { MarketDispute } from "lib/types/markets";
import { estimateMarketResolutionDate } from "lib/util/estimate-market-resolution";
import { getMarketStatusDetails } from "lib/util/market-status-details";
import { isAbsoluteUrl } from "next/dist/shared/lib/utils";
import { FC, useState } from "react";
import Image from "next/image";
import { MarketMetadataBadges } from "./MarketMetadataBadges";
import { MarketHistoryModal } from "./MarketHistoryModal";
import { MarketOutcomeDisplay } from "./MarketOutcomeDisplay";
import { MarketStats } from "./MarketStats";
import { MarketTimer, MarketTimerSkeleton } from "./MarketTimer";

// Re-export utility components for backward compatibility
export { UserIdentity, HeaderStat, Tag } from "./MarketHeaderUtils";

const MarketHeader: FC<{
  market: MarketPageIndexedData;
  report?: MarketReport;
  disputes?: MarketDispute;
  resolvedOutcome?: string;
  token?: string;
  marketStage?: MarketStage;
  rejectReason?: string;
  promotionData?: PromotedMarket | null;
  poolId?: number; // Optional poolId for combo markets
}> = ({
  market,
  report,
  disputes,
  resolvedOutcome,
  token,
  marketStage,
  rejectReason,
  promotionData,
  poolId,
}) => {
  const { categories, status, period, marketType, scalarType } = market;
  const [showMarketHistory, setShowMarketHistory] = useState(false);
  const starts = Number(period.start);
  const ends = Number(period.end);

  const { outcome, by } = getMarketStatusDetails(
    marketType,
    categories,
    status,
    scalarType,
    disputes,
    report,
    resolvedOutcome,
  );

  const { data: marketHistory } = useMarketEventHistory(
    market.marketId.toString(),
  );

  // Use poolStats for combo markets, marketStats for regular markets
  const { data: marketStats, isLoading: isMarketStatsLoading } =
    useMarketsStats(poolId ? [] : [market.marketId]);

  const { data: poolStats, isLoading: isPoolStatsLoading } = usePoolStats(
    poolId ? [poolId] : [],
  );

  const isStatsLoading = poolId ? isPoolStatsLoading : isMarketStatsLoading;
  const stats = poolId ? poolStats : marketStats;

  const liquidity = stats?.[0]?.liquidity;
  const participants = poolId
    ? (poolStats?.[0] as any)?.traders
    : stats?.[0]?.participants;

  const volume =
    poolId && poolStats?.[0]?.volume
      ? new Decimal(poolStats[0].volume).div(ZTG).toNumber()
      : new Decimal(market.volume).div(ZTG).toNumber();

  const oracleReported = marketHistory?.reported?.by === market.oracle;

  const gracePeriodMS =
    Number(market.deadlines?.gracePeriod ?? 0) * BLOCK_TIME_SECONDS * 1000;
  const reportsOpenAt = Number(market.period.end) + gracePeriodMS;

  const resolutionDateEstimate = estimateMarketResolutionDate(
    new Date(Number(market.period.end)),
    BLOCK_TIME_SECONDS,
    Number(market.deadlines?.gracePeriod ?? 0),
    Number(market.deadlines?.oracleDuration ?? 0),
    Number(market.deadlines?.disputeDuration ?? 0),
  );

  const assetId = parseAssetId(market.baseAsset).unwrap();
  const imagePath = lookupAssetImagePath(assetId);

  const { data: caseId } = useMarketCaseId(market.marketId);

  const { data: marketImage } = useMarketImage(market, {
    fallback:
      market.img &&
      isAbsoluteUrl(market.img) &&
      !isMarketImageBase64Encoded(market.img)
        ? market.img
        : undefined,
  });

  return (
    <header className="flex w-full flex-col gap-2 sm:gap-3">
      <div className="rounded-lg bg-white/15 p-3 shadow-lg backdrop-blur-md sm:p-4 md:p-5">
        {/* Hero Section */}
        <div className="mb-3 flex gap-3 sm:mb-4 sm:gap-4 md:gap-5">
          {/* Icon */}
          <div className="flex-shrink-0 self-start">
            <div className="relative h-14 w-14 overflow-hidden rounded-lg shadow-md sm:h-16 sm:w-16 md:h-20 md:w-20">
              <Image
                alt="Market image"
                src={marketImage ?? ""}
                fill
                className="overflow-hidden rounded-lg"
                style={{
                  objectFit: "cover",
                  objectPosition: "50% 50%",
                }}
                sizes="100px"
              />
            </div>
          </div>

          {/* Title + Badges */}
          <div className="flex min-h-[56px] flex-1 flex-col justify-between sm:min-h-[60px]">
            <div className="flex-[2]">
              <h1 className="text-xl font-bold leading-tight text-white/90 sm:text-2xl md:text-4xl">
                {market.question}
              </h1>
              {rejectReason && rejectReason.length > 0 && (
                <div className="border-r-2ed-500/40 mt-1 rounded-md border-2 bg-red-900/30 px-2.5 py-1 text-xs text-red-400 backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-sm">
                  Market rejected: {rejectReason}
                </div>
              )}
            </div>
            <div className="flex-1 pt-1">
              <MarketMetadataBadges
                market={market}
                token={token}
                imagePath={imagePath}
                promotionData={promotionData}
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-2 sm:mb-3">
          <MarketStats
            starts={starts}
            ends={ends}
            status={status}
            resolutionDateEstimate={resolutionDateEstimate}
            reportsOpenAt={reportsOpenAt}
            volume={volume}
            liquidity={liquidity}
            participants={participants}
            token={token}
            isStatsLoading={isStatsLoading}
          />
        </div>

        {/* Timer Section */}
        <div className="flex w-full flex-col gap-1.5 sm:gap-2">
          {marketStage?.type === "Court" ? (
            <div className="w-full">
              <h3 className="mb-1.5 text-xs text-white/70 sm:mb-2 sm:text-sm">
                Market is in court
              </h3>
              {caseId != null ? (
                <CourtStageTimer caseId={caseId} />
              ) : (
                <Skeleton height={22} className="w-full rounded-md" />
              )}
            </div>
          ) : marketStage ? (
            <MarketTimer stage={marketStage} />
          ) : (
            <MarketTimerSkeleton />
          )}
        </div>
      </div>

      {(status === "Reported" ||
        status === "Disputed" ||
        status === "Resolved") &&
        marketHistory && (
          <MarketOutcomeDisplay
            setShowMarketHistory={setShowMarketHistory}
            status={status}
            outcome={outcome ?? ""}
            by={by}
            marketHistory={marketHistory}
          />
        )}

      <Modal
        open={showMarketHistory}
        onClose={() => setShowMarketHistory(false)}
      >
        {marketHistory && (
          <MarketHistoryModal
            marketHistory={marketHistory}
            oracleReported={oracleReported}
            categories={categories}
            marketType={marketType}
            setShowMarketHistory={setShowMarketHistory}
            scalarType={scalarType}
          />
        )}
      </Modal>
    </header>
  );
};

export default MarketHeader;
