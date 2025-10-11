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
import { MarketHero } from "./MarketHero";
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
    <header className="flex w-full flex-col gap-4">
      <MarketHero
        question={market.question}
        marketImage={marketImage ?? ""}
        rejectReason={rejectReason}
        market={market}
        token={token}
        imagePath={imagePath}
        promotionData={promotionData}
      />

      <div className="rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 p-2.5 shadow-lg">
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

        <div className="mt-2.5 flex w-full flex-col gap-2">
          {marketStage?.type === "Court" ? (
            <div className="w-full">
              <h3 className="mb-2 text-sm text-gray-700">Market is in court</h3>
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
