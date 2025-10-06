import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ChevronDown, ChevronUp } from "react-feather";
import { useState } from "react";

type ReferendumSignalResponse = {
  referendumId: number;
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
    recommendation: "approve" | "reject" | "uncertain";
    reasoning: string;
  };
};

const ReferendumSignalWidget = () => {
  const router = useRouter();
  const { refId } = router.query;
  const referendumIdRaw = Array.isArray(refId) ? refId[0] : refId;

  // Validate referendum ID is a positive integer to prevent SSRF attacks
  const referendumId = referendumIdRaw && /^\d+$/.test(referendumIdRaw)
    ? parseInt(referendumIdRaw, 10)
    : null;

  const [showAllOutcomes, setShowAllOutcomes] = useState(false);
  const [showRelatedMarkets, setShowRelatedMarkets] = useState(false);

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
    }
  );

  // Don't render anything if no data or loading
  if (isLoading || !data?.combinatorial_market || !data?.futarchy_signal) {
    return null;
  }

  const { combinatorial_market, futarchy_signal } = data;
  // Sort all outcomes by probability
  const sortedOutcomes = [...combinatorial_market.outcomes]
    .sort((a, b) => b.probability - a.probability);

  // Get top outcome by default
  const topOutcome = sortedOutcomes.slice(0, 1);

  // Determine which outcomes to display
  const outcomesToDisplay = showAllOutcomes ? sortedOutcomes : topOutcome;

  const getRecommendationColor = () => {
    switch (futarchy_signal.recommendation) {
      case "approve":
        return "text-green-600";
      case "reject":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getRecommendationText = () => {
    switch (futarchy_signal.recommendation) {
      case "approve":
        return "Markets Suggest: Approve";
      case "reject":
        return "Markets Suggest: Reject";
      default:
        return "Markets Suggest: Uncertain";
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

      {/* Recommendation */}
      <div className="mb-2">
        <div className={`text-lg font-bold ${getRecommendationColor()}`}>
          {getRecommendationText()}
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-4 text-xs text-gray-600">
        {futarchy_signal.reasoning}
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
                  idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-blue-300" : "bg-blue-200"
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
          className="mt-2 flex w-full items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
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

      {/* Related Markets Section */}
      <div className="border-t mt-3">
        <button
          onClick={() => setShowRelatedMarkets(!showRelatedMarkets)}
          className="flex w-full items-center py-3 gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          {showRelatedMarkets ? (
            <>
              Hide Related Markets <ChevronUp size={16} />
            </>
          ) : (
            <>
              Show Related Markets <ChevronDown size={16} />
            </>
          )}
        </button>

        {showRelatedMarkets && (
          <ol className="list-decimal list-inside space-y-2 pb-3">
            <li className="text-xs text-gray-500">
              <a
                href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.zeitgeist.pm'}/markets/${combinatorial_market.market_1.marketId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline"
              >
                {combinatorial_market.market_1.question}
              </a>
            </li>
            <li className="text-xs text-gray-500">
              <a
                href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.zeitgeist.pm'}/markets/${combinatorial_market.market_2.marketId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline"
              >
                {combinatorial_market.market_2.question}
              </a>
            </li>
          </ol>
        )}
      </div>


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
};

export default ReferendumSignalWidget;
