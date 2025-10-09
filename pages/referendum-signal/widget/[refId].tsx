import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ChevronDown, ChevronUp } from "react-feather";
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
    }>;
    pool_url: string;
  };
  futarchy_signal?: {
    recommendation: string;
    reasoning: string;
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

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 items-top justify-center mb-3">
          <div className="flex-1 rounded border border-blue-200 bg-blue-50 p-2">
            <div className="mb-1 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xxs font-semibold text-blue-800">
              Assume
            </div>
            <div className="text-xs text-gray-700 line-clamp-2">
              <a
                href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://app.zeitgeist.pm"}/markets/${combinatorial_market.market_1.marketId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline"
              >
                {combinatorial_market.market_1.question}
              </a>
            </div>
          </div>
          <div className="flex-1 rounded border border-green-200 bg-green-50 p-2">
            <div className="mb-1 inline-block rounded bg-green-100 px-1.5 py-0.5 text-xxs font-semibold text-green-800">
              Then
            </div>
            <div className="text-xs text-gray-700 line-clamp-2">
              <a
                href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://app.zeitgeist.pm"}/markets/${combinatorial_market.market_2.marketId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-600 hover:underline"
              >
                {combinatorial_market.market_2.question}
              </a>
            </div>
          </div>
        </div>

        {/* Outcomes */}
        <div className="space-y-3">
          {outcomesToDisplay.map((outcome, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {outcome.combination}
                </span>
                <span className="font-bold text-gray-900">
                  {Math.round(outcome.probability * 100)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full transition-all ${
                    idx === 0
                      ? "bg-blue-500"
                      : idx === 1
                        ? "bg-blue-300"
                        : "bg-blue-200"
                  }`}
                  style={{ width: `${outcome.probability * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse Button */}
        {sortedOutcomes.length > 1 && (
          <button
            onClick={() => setShowAllOutcomes(!showAllOutcomes)}
            className="my-2 flex w-full items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            {showAllOutcomes ? (
              <>
                Show Less <ChevronUp size={16} />
              </>
            ) : (
              <>
                Show All Outcomes <ChevronDown size={16} />
              </>
            )}
          </button>
        )}

        {/* Footer Link */}
        <div className="border-t pt-2">
          <a
            href={combinatorial_market.pool_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Trade on Zeitgeist
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    );
  }

  // Render base markets view if no combinatorial market
  if (data.base_markets && data.base_markets.length > 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Prediction Markets for Referendum #{data.referendumId}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Trade on the outcomes related to this proposal
          </p>
        </div>

        <div className="space-y-2">
          {data.base_markets.map((market) => (
            <a
              key={market.marketId}
              href={market.market_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded border border-gray-200 bg-gray-50 p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900 line-clamp-2">
                    {market.question}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xxs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Volume:</span>
                      {parseFloat(market.volume).toFixed(0)} ZTG
                    </span>
                    <span>•</span>
                    <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${
                      market.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {market.status}
                    </span>
                  </div>
                </div>
                <ExternalLink size={14} className="flex-shrink-0 text-gray-400" />
              </div>
            </a>
          ))}
        </div>

        <div className="border-t pt-3 mt-3">
          <p className="text-xxs text-gray-600">
            Powered by{" "}
            <a
              href="https://app.zeitgeist.pm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-700"
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
