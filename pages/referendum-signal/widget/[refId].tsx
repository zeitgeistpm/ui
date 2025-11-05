import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ChevronDown, ChevronUp, Info, BarChart2 } from "react-feather";
import { useState } from "react";

type ReferendumSignalResponse = {
  referendumId: number;
  base_markets: Array<{
    marketId: number;
    question: string;
    status: string;
    volume: string;
    market_url: string;
  }>;
  combinatorial_market?: {
    poolId: number;
    market_1: { marketId: number; question: string };
    market_2: { marketId: number; question: string };
    outcomes: Array<{
      combination: string;
      probability: number;
      description?: string;
    }>;
    volume?: string;
    liquidity?: string;
    pool_url: string;
  };
  futarchy_signal?: {
    recommendation: string;
    reasoning: string;
    confidence?: number;
    welfare_metric?: string;
  };
};

const ReferendumSignalWidget = () => {
  const router = useRouter();
  const { refId } = router.query;
  const referendumIdRaw = Array.isArray(refId) ? refId[0] : refId;

  // Validate referendum ID is a positive integer to prevent SSRF attacks
  const referendumId =
    referendumIdRaw && /^\d+$/.test(referendumIdRaw)
      ? parseInt(referendumIdRaw, 10)
      : null;

  const [showAllOutcomes, setShowAllOutcomes] = useState(false);

  const { data, isLoading } = useQuery(
    ["referendum-signal-widget", referendumId],
    async () => {
      if (!referendumId || referendumId < 0) return null;
      const res = await fetch(`/api/referendum/${referendumId}/signal`);
      if (!res.ok) return null;
      return res.json() as Promise<ReferendumSignalResponse>;
    },
    {
      enabled: !!referendumId && referendumId > 0,
      staleTime: 60_000,
      retry: false,
    },
  );

  // Don't render anything if loading or no data
  if (isLoading || !data) {
    return null;
  }

  // Render combinatorial market view if available
  if (data.combinatorial_market && data.futarchy_signal) {
    const { combinatorial_market, futarchy_signal } = data;

    // Sort all outcomes by probability
    const sortedOutcomes = [...combinatorial_market.outcomes].sort(
      (a, b) => b.probability - a.probability,
    );

    // Get top outcome by default
    const topOutcome = sortedOutcomes.slice(0, 1);

    // Determine which outcomes to display
    const outcomesToDisplay = showAllOutcomes ? sortedOutcomes : topOutcome;

    // Calculate colors for outcomes
    const getOutcomeColor = (index: number) => {
      const colors = [
        "#3B82F6", // blue-500
        "#60A5FA", // blue-400
        "#93C5FD", // blue-300
        "#DBEAFE", // blue-200
      ];
      return colors[index % colors.length];
    };

    return (
      <div className="w-full max-w-md rounded-lg border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-lg">
        {/* Compact Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-white">
              Ref #{data.referendumId}
            </h3>
            <div className="rounded bg-ztg-primary-800/40 px-1.5 py-0.5 text-xxs font-semibold text-white backdrop-blur-sm">
              Futarchy
            </div>
          </div>
          {/* Volume in top right */}
          {combinatorial_market.volume && (
            <div className="flex items-center gap-1 text-xxs text-white/80">
              <BarChart2 size={12} className="text-white/70" />
              <span className="font-medium text-white">
                {parseFloat(combinatorial_market.volume).toFixed(0)} - ZTG
              </span>
            </div>
          )}
        </div>

        {/* Compact Market Info - Inline */}
        <div className="mb-3 space-y-1.5 text-xxs text-white/80">
          <div className="flex items-start gap-1.5">
            <span className="font-semibold text-blue-300">Assume:</span>
            <a
              href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://app.zeitgeist.pm"}/markets/${combinatorial_market.market_1.marketId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-1 flex-1 transition-colors hover:text-blue-300 hover:underline"
            >
              {combinatorial_market.market_1.question}
            </a>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-semibold text-ztg-green-400">Then:</span>
            <a
              href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://app.zeitgeist.pm"}/markets/${combinatorial_market.market_2.marketId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-1 flex-1 transition-colors hover:text-ztg-green-300 hover:underline"
            >
              {combinatorial_market.market_2.question}
            </a>
          </div>
        </div>

        {/* Futarchy Signal - Compact */}
        {futarchy_signal.recommendation && (
          <div className="mb-3 rounded-lg border border-ztg-green-500/30 bg-white/10 p-2 shadow-sm backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-1.5">
              <Info size={12} className="text-ztg-green-400" />
              <span className="text-xxs font-semibold text-white">Signal</span>
            </div>
            <div className="text-xs font-bold text-ztg-green-400">
              {futarchy_signal.recommendation}
            </div>
            {futarchy_signal.confidence && (
              <div className="mt-0.5 text-xxs text-white/70">
                {Math.round(futarchy_signal.confidence * 100)}% confidence
              </div>
            )}
          </div>
        )}

        {/* Outcomes - Compact */}
        <div className="mb-2 space-y-1.5">
          {outcomesToDisplay.map((outcome, idx) => {
            const probabilityPercent = Math.round(outcome.probability * 100);
            const color = getOutcomeColor(idx);

            return (
              <div
                key={idx}
                className="rounded border-l-2 bg-white/5 p-2 shadow-sm backdrop-blur-sm"
                style={{ borderLeftColor: color }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xxs font-medium text-white line-clamp-1">
                    {outcome.combination}
                  </span>
                  <span className="ml-2 text-xs font-bold text-white">
                    {probabilityPercent}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${probabilityPercent}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand/Collapse Button - Compact */}
        {sortedOutcomes.length > 1 && (
          <button
            onClick={() => setShowAllOutcomes(!showAllOutcomes)}
            className="mb-2 flex w-full items-center justify-center gap-1 rounded bg-white/10 px-2 py-1 text-xxs font-medium text-white/80 transition-all hover:bg-white/15 hover:text-white"
          >
            {showAllOutcomes ? (
              <>
                Show Less <ChevronUp size={12} />
              </>
            ) : (
              <>
                Show All {sortedOutcomes.length} <ChevronDown size={12} />
              </>
            )}
          </button>
        )}

        {/* Footer Link - Compact */}
        <div className="border-t border-white/10 pt-2">
          <a
            href={combinatorial_market.pool_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ztg-green-600/90 px-3 py-1.5 text-xxs font-semibold text-white transition-all hover:bg-ztg-green-600 shadow-sm backdrop-blur-sm"
          >
            Trade on Zeitgeist
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    );
  }

  // Render base markets view if no combinatorial market
  if (data.base_markets && data.base_markets.length > 0) {
    return (
      <div className="w-full max-w-md rounded-lg border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-lg">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">
            Ref #{data.referendumId} Markets
          </h3>
        </div>

        <div className="space-y-2">
          {data.base_markets.map((market) => (
            <a
              key={market.marketId}
              href={market.market_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-white/10 bg-white/10 p-2 shadow-sm backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/15"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="line-clamp-2 text-xxs font-medium text-white">
                    {market.question}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xxs text-white/70">
                    <span>{parseFloat(market.volume).toFixed(0)} ZTG</span>
                    <span>•</span>
                    <span className="rounded bg-white/10 px-1 py-0.5 font-medium text-white/90">
                      {market.status}
                    </span>
                  </div>
                </div>
                <ExternalLink
                  size={12}
                  className="flex-shrink-0 text-white/60 transition-colors hover:text-white"
                />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-3 border-t border-white/10 pt-2">
          <p className="text-center text-xxs text-white/70">
            Powered by{" "}
            <a
              href="https://app.zeitgeist.pm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ztg-green-400 transition-colors hover:text-ztg-green-300"
            >
              Zeitgeist
            </a>
          </p>
        </div>
      </div>
    );
  }

  // No markets found
  return null;
};

export default ReferendumSignalWidget;
