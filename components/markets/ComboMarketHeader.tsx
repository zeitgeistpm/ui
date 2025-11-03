import { FC, useState } from "react";
import { AssetId, MarketStage, ZTG } from "@zeitgeistpm/sdk";
import { MarketTimer, MarketTimerSkeleton } from "./MarketTimer";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { useBalance } from "lib/hooks/queries/useBalance";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
import { Info, ExternalLink, ChevronDown, ChevronUp } from "react-feather";
import Link from "next/link";

interface ComboMarketHeaderProps {
  sourceMarketStages: Array<{
    market: FullMarketFragment;
    stage: MarketStage | null | undefined;
  }>;
  walletAddress?: string;
}

// Component to display individual outcome balance
const OutcomeBalance = ({
  assetId,
  walletAddress,
  outcomeName,
  color,
}: {
  assetId: AssetId;
  walletAddress: string;
  outcomeName: string;
  color?: string;
}) => {
  const { data: balance } = useBalance(walletAddress, assetId);
  const balanceDisplay = balance?.div(ZTG).toFixed(2) || "0.00";

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 px-2 py-1.5 text-xs shadow-md backdrop-blur-sm">
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

const ComboMarketHeader: FC<ComboMarketHeaderProps> = ({
  sourceMarketStages,
  walletAddress,
}) => {
  const [showBalances, setShowBalances] = useState(false);

  return (
    <div className="mb-3 flex flex-col gap-2 lg:flex-row">
      {sourceMarketStages.map((item, index) => {
        const roleLabel = index === 0 ? "Assume" : "Then";
        const pillColor =
          index === 0
            ? "bg-blue-500/80 text-white border-blue-400/40"
            : "bg-ztg-green-500/80 text-white border-ztg-green-400/40";
        const borderColor =
          index === 0
            ? "border-blue-500/40"
            : "border-ztg-green-500/40";
        const roleDescription =
          index === 0
            ? "The condition/assumption market (i.e. event market)"
            : "The outcome/consequence market (i.e. welfare metric market)";

        return (
          <div
            key={item.market?.marketId}
            className={`flex-1 rounded-lg border ${borderColor} bg-white/15 shadow-lg backdrop-blur-md p-3 sm:p-4`}
          >
            {/* Header with pill, tooltip, and Trade Market button */}
            <div className={`mb-2 flex items-center gap-2`}>
              <div
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${pillColor}`}
              >
                <span>{roleLabel}</span>
                <div className="group relative">
                  <Info size={14} className="cursor-help text-white/90" />
                  <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-64 rounded-lg border border-white/20 bg-ztg-primary-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-lg opacity-0 transition-opacity group-hover:opacity-100">
                    {roleDescription}
                    <div className="absolute left-2 top-full">
                      <div className="h-2 w-2 rotate-45 bg-ztg-primary-900/95 border-l border-t border-white/20"></div>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-white/80">
                {item.market?.status}
              </span>
              <Link
                href={`/markets/${item.market?.marketId}`}
                className={`ml-auto flex items-center rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-md ${
                  index === 0
                    ? "hover:border-blue-400/40"
                    : "hover:border-ztg-green-400/40"
                }`}
              >
                Trade Market <ExternalLink size={12} className="ml-1" />
              </Link>
            </div>

            {/* Question */}
            <h3 className="mb-2 line-clamp-2 min-h-10 text-base font-semibold leading-snug text-white sm:text-lg">
              {item.market?.question}
            </h3>

            {/* Market Timer/Status */}
            {item.stage ? (
              <MarketTimer stage={item.stage} />
            ) : (
              <MarketTimerSkeleton />
            )}

            {/* Token balances section */}
            {walletAddress && item.market?.categories && (
              <div className="mt-3 rounded-lg border border-white/10 bg-white/10 shadow-md backdrop-blur-sm">
                <button
                  onClick={() => setShowBalances(!showBalances)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-white/90 transition-colors hover:bg-white/20"
                >
                  <span>Outcome Balances</span>
                  {showBalances ? (
                    <ChevronUp size={14} className="text-white/80" />
                  ) : (
                    <ChevronDown size={14} className="text-white/80" />
                  )}
                </button>
                {showBalances && (
                  <div className="border-t border-white/10 p-3">
                    <div className="space-y-2">
                      {item.market.outcomeAssets?.map(
                        (assetString, outcomeIndex) => {
                          const assetId =
                            parseAssetIdStringWithCombinatorial(assetString);
                          return assetId ? (
                            <OutcomeBalance
                              key={outcomeIndex}
                              assetId={assetId as any}
                              walletAddress={walletAddress}
                              outcomeName={
                                item.market.categories?.[outcomeIndex]?.name ||
                                `Outcome ${outcomeIndex}`
                              }
                              color={
                                item.market.categories?.[outcomeIndex]?.color ??
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
        );
      })}
    </div>
  );
};

export default ComboMarketHeader;
