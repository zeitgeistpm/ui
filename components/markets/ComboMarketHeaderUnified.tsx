import { FC, useState } from "react";
import { MarketStage, ZTG } from "@zeitgeistpm/sdk";
import { MarketTimer, MarketTimerSkeleton } from "./MarketTimer";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { useBalance } from "lib/hooks/queries/useBalance";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
import { Info, ExternalLink, ChevronDown, ChevronUp } from "react-feather";
import Link from "next/link";
import { MarketStats } from "./MarketStats";
import Decimal from "decimal.js";
import { usePoolStats } from "lib/hooks/queries/usePoolStats";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";
import { estimateMarketResolutionDate } from "lib/util/estimate-market-resolution";
import { BLOCK_TIME_SECONDS } from "lib/constants";
import { MarketStatus } from "@zeitgeistpm/indexer";
import { Disclosure, Transition } from "@headlessui/react";
import { isInfinity, infinity } from "@zeitgeistpm/utility/dist/infinity";

interface ComboMarketHeaderUnifiedProps {
  poolId: number;
  sourceMarketStages: Array<{
    market: FullMarketFragment;
    stage: MarketStage | null | undefined;
  }>;
  walletAddress?: string;
  virtualMarket?: any;
}

const OutcomeBalance = ({
  assetId,
  walletAddress,
  outcomeName,
  color,
}: {
  assetId: any;
  walletAddress: string;
  outcomeName: string;
  color?: string;
}) => {
  const { data: balance } = useBalance(walletAddress, assetId);
  const balanceDisplay = balance?.div(ZTG).toFixed(2) || "0.00";

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs shadow-md backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {color && (
          <div
            className="h-2.5 w-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="font-medium text-white/90">{outcomeName}</span>
      </div>
      <span className="font-bold text-white">{balanceDisplay}</span>
    </div>
  );
};

const SourceMarketCard = ({
  market,
  stage,
  roleLabel,
  walletAddress,
}: {
  market: FullMarketFragment;
  stage: MarketStage | null | undefined;
  roleLabel: "Assume" | "Then";
  walletAddress?: string;
}) => {
  const [showBalances, setShowBalances] = useState(false);

  const pillColor =
    roleLabel === "Assume"
      ? "bg-blue-500/80 text-white border-blue-400/40"
      : "bg-ztg-green-500/80 text-white border-ztg-green-400/40";
  const borderColor =
    roleLabel === "Assume" ? "border-blue-500/40" : "border-ztg-green-500/40";
  const hoverBorderColor =
    roleLabel === "Assume"
      ? "hover:border-blue-400/60"
      : "hover:border-ztg-green-400/60";

  return (
    <Disclosure>
      {({ open }) => (
        <div
          className={`flex h-full w-full flex-col rounded-lg border-l-4 ${borderColor} bg-white/5 shadow-md backdrop-blur-sm transition-all ${hoverBorderColor}`}
        >
          <Disclosure.Button className="flex w-full">
            <div className="flex h-14 w-full items-center gap-2 p-2 text-left sm:gap-2.5 sm:p-2.5">
              <div
                className={`flex-shrink-0 rounded-lg border px-1.5 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-sm ${pillColor}`}
              >
                {roleLabel}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-white sm:text-sm">
                  {market.question}
                </h3>
              </div>

              <ChevronDown
                size={16}
                className={`flex-shrink-0 text-white/60 transition-transform duration-200 sm:hidden ${
                  open ? "rotate-180" : ""
                }`}
              />
              <ChevronDown
                size={18}
                className={`hidden flex-shrink-0 text-white/60 transition-transform duration-200 sm:block ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </Disclosure.Button>

          <Transition
            enter="transition duration-200 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-150 ease-in"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
              <div className="space-y-2 border-t border-white/10 pt-2 sm:space-y-2.5 sm:pt-2.5">
                {/* Status and Trade Button Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-white/80">
                    {market.status}
                  </span>
                  <Link
                    href={`/markets/${market.marketId}`}
                    className={`flex items-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white ${
                      roleLabel === "Assume"
                        ? "hover:border-blue-400/40"
                        : "hover:border-ztg-green-400/40"
                    }`}
                  >
                    Trade Market <ExternalLink size={11} className="ml-1" />
                  </Link>
                </div>

                {/* Market Timer */}
                <div>
                  {stage ? (
                    <MarketTimer stage={stage} />
                  ) : (
                    <MarketTimerSkeleton />
                  )}
                </div>

                {/* Token balances section */}
                {walletAddress && market?.categories && (
                  <div className="rounded-lg border border-white/10 bg-white/5">
                    <button
                      onClick={() => setShowBalances(!showBalances)}
                      className="flex w-full items-center justify-between px-2.5 py-2 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10"
                    >
                      <span>Outcome Balances</span>
                      {showBalances ? (
                        <ChevronUp size={12} className="text-white/80" />
                      ) : (
                        <ChevronDown size={12} className="text-white/80" />
                      )}
                    </button>
                    {showBalances && (
                      <div className="border-t border-white/10 p-2.5">
                        <div className="space-y-1.5">
                          {market.outcomeAssets?.map(
                            (assetString, outcomeIndex) => {
                              const assetId =
                                parseAssetIdStringWithCombinatorial(
                                  assetString,
                                );
                              return assetId ? (
                                <OutcomeBalance
                                  key={outcomeIndex}
                                  assetId={assetId as any}
                                  walletAddress={walletAddress}
                                  outcomeName={
                                    market.categories?.[outcomeIndex]?.name ||
                                    `Outcome ${outcomeIndex}`
                                  }
                                  color={
                                    market.categories?.[outcomeIndex]?.color ??
                                    undefined
                                  }
                                />
                              ) : null;
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};

const ComboMarketHeaderUnified: FC<ComboMarketHeaderUnifiedProps> = ({
  poolId,
  sourceMarketStages,
  walletAddress,
  virtualMarket,
}) => {
  const { data: poolStats, isLoading: isStatsLoading } = usePoolStats([poolId]);

  // Get earliest start date and latest end date from source markets
  const starts = Math.min(
    ...sourceMarketStages.map((item) => Number(item.market.period.start)),
  );
  const ends = Math.max(
    ...sourceMarketStages.map((item) => Number(item.market.period.end)),
  );

  const liquidity = poolStats?.[0]?.liquidity;
  const volume = poolStats?.[0]?.volume
    ? new Decimal(poolStats[0].volume).div(ZTG).toNumber()
    : 0;

  const participants = (poolStats?.[0] as any)?.traders;

  // Determine combo market status from source markets
  // If both are Active, combo is Active. If both are Resolved, combo is Resolved.
  // Otherwise, use the most restrictive status
  const comboStatus: MarketStatus = sourceMarketStages.every(
    (item) => item.market.status === MarketStatus.Active,
  )
    ? MarketStatus.Active
    : sourceMarketStages.every(
          (item) => item.market.status === MarketStatus.Resolved,
        )
      ? MarketStatus.Resolved
      : sourceMarketStages.some(
            (item) => item.market.status === MarketStatus.Resolved,
          )
        ? MarketStatus.Closed
        : sourceMarketStages[0].market.status;

  // Estimate resolution date
  const gracePeriodMS =
    Number(virtualMarket?.deadlines?.gracePeriod ?? 0) *
    BLOCK_TIME_SECONDS *
    1000;
  const reportsOpenAt = ends + gracePeriodMS;
  const resolutionDateEstimate = estimateMarketResolutionDate(
    new Date(ends),
    BLOCK_TIME_SECONDS,
    Number(virtualMarket?.deadlines?.gracePeriod ?? 0),
    Number(virtualMarket?.deadlines?.oracleDuration ?? 0),
    Number(virtualMarket?.deadlines?.disputeDuration ?? 0),
  );

  const comboStage: MarketStage | null =
    sourceMarketStages[0]?.stage && sourceMarketStages[1]?.stage
      ? (() => {
          const stage0 = sourceMarketStages[0].stage;
          const stage1 = sourceMarketStages[1].stage;
          
          const isRemainingInfinity0 = isInfinity(stage0.remainingTime);
          const isRemainingInfinity1 = isInfinity(stage1.remainingTime);
          const isTotalInfinity0 = isInfinity(stage0.totalTime);
          const isTotalInfinity1 = isInfinity(stage1.totalTime);
          
          const hasInfinityRemaining = isRemainingInfinity0 || isRemainingInfinity1;
          const hasInfinityTotal = isTotalInfinity0 || isTotalInfinity1;
          
          if (hasInfinityRemaining && hasInfinityTotal) {
            return {
              type: stage0.type,
              remainingTime: infinity,
              totalTime: infinity,
            } as MarketStage;
          } else {
            return {
              type: stage0.type,
              remainingTime: hasInfinityRemaining
                ? infinity
                : Math.min(
                    stage0.remainingTime as number,
                    stage1.remainingTime as number,
                  ),
              totalTime: hasInfinityTotal
                ? infinity
                : Math.min(
                    stage0.totalTime as number,
                    stage1.totalTime as number,
                  ),
            } as MarketStage;
          }
        })()
      : (sourceMarketStages[0]?.stage ?? sourceMarketStages[1]?.stage ?? null);

  return (
    <div className="space-y-4">
      {/* Source Markets Section with Arrow */}
      <div className="flex flex-col items-start gap-2.5 lg:flex-row lg:items-start lg:gap-2.5">
        <div className="flex min-w-0 w-full flex-1 lg:w-auto">
          <SourceMarketCard
            market={sourceMarketStages[0].market}
            stage={sourceMarketStages[0].stage}
            roleLabel="Assume"
            walletAddress={walletAddress}
          />
        </div>

        {/* Arrow indicator */}
        <div className="flex h-5 w-5 items-center justify-center self-center rounded-full bg-white/10 shadow-md backdrop-blur-sm">
          <span className="text-xs font-medium leading-none text-white/60">
            →
          </span>
        </div>

        <div className="flex min-w-0 w-full flex-1 lg:w-auto">
          <SourceMarketCard
            market={sourceMarketStages[1].market}
            stage={sourceMarketStages[1].stage}
            roleLabel="Then"
            walletAddress={walletAddress}
          />
        </div>
      </div>

      {/* Market Stats */}
      <div className="mb-2 sm:mb-3">
        <MarketStats
          starts={starts}
          ends={ends}
          status={comboStatus}
          resolutionDateEstimate={resolutionDateEstimate}
          reportsOpenAt={reportsOpenAt}
          volume={volume}
          liquidity={liquidity}
          participants={participants}
          token="ZTG"
          isStatsLoading={isStatsLoading}
        />
      </div>

      {/* Market Timer */}
      {comboStage ? (
        <MarketTimer stage={comboStage} />
      ) : (
        <MarketTimerSkeleton />
      )}
    </div>
  );
};

export default ComboMarketHeaderUnified;
