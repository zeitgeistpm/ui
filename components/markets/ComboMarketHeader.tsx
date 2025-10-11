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
    <div className="flex items-center justify-between rounded-md bg-white/50 px-2 py-1.5 text-xs">
      <div className="flex items-center gap-2">
        {color && (
          <div
            className="h-2.5 w-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="font-medium text-gray-700">{outcomeName}</span>
      </div>
      <span className="font-bold text-gray-900">{balanceDisplay}</span>
    </div>
  );
};

const ComboMarketHeader: FC<ComboMarketHeaderProps> = ({
  sourceMarketStages,
  walletAddress,
}) => {
  const [showBalances, setShowBalances] = useState(false);

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row">
      {sourceMarketStages.map((item, index) => {
        const roleLabel = index === 0 ? "Assume" : "Then";
        const roleColor =
          index === 0
            ? "bg-blue-100 text-blue-700"
            : "bg-green-100 text-green-700";
        const pillColor =
          index === 0 ? "bg-blue-500 text-white" : "bg-green-500 text-white";
        const roleDescription =
          index === 0
            ? "The condition/assumption market (i.e. event market)"
            : "The outcome/consequence market (i.e. welfare metric market)";

        return (
          <div
            key={item.market?.marketId}
            className={`flex-1 rounded-lg shadow-lg ${
              index === 0
                ? "bg-gradient-to-br from-blue-50 to-blue-100/50"
                : "bg-gradient-to-br from-green-50 to-green-100/50"
            } p-4`}
          >
            {/* Header with pill, tooltip, and Trade Market button */}
            <div className={`mb-3 flex items-center gap-2 `}>
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${pillColor}`}
              >
                <span>{roleLabel}</span>
                <div className="group relative">
                  <Info size={14} className="cursor-help" />
                  <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {roleDescription}
                    <div className="absolute left-2 top-full">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600">
                {item.market?.status}
              </span>
              <Link
                href={`/markets/${item.market?.marketId}`}
                className={`ml-auto flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md ${
                  index === 0
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                Trade Market <ExternalLink size={12} className="ml-1" />
              </Link>
            </div>

            {/* Question */}
            <h3 className="min-h-12 mb-3 line-clamp-2 text-base font-semibold leading-snug text-gray-900">
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
              <div className="mt-3 rounded-lg bg-white/60 shadow-md backdrop-blur-sm">
                <button
                  onClick={() => setShowBalances(!showBalances)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-white/80"
                >
                  <span>Outcome Balances</span>
                  {showBalances ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
                {showBalances && (
                  <div className="border-t border-gray-200/50 p-3">
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
