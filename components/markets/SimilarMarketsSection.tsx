import type { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ScalarRangeType } from "@zeitgeistpm/sdk";
import MarketCard from "components/markets/market-card";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { useRecommendedMarkets } from "lib/hooks/queries/useRecommendedMarkets";

export const SimilarMarketsSection = ({
  market,
  limit,
}: {
  market?: FullMarketFragment;
  limit?: number;
}) => {
  const { data: recommendedMarkets, isFetched: isMarketsFetched } =
    useRecommendedMarkets(market?.marketId, limit ?? 2);

  const { data: stats, isFetched: isStatsFetched } = useMarketsStats(
    recommendedMarkets?.markets?.map((m) => m.marketId) ?? [],
  );

  const isLoading = !isMarketsFetched || !isStatsFetched;

  return (
    <>
      {!isLoading && recommendedMarkets && (
        <div className="relative z-[-1] animate-pop-in rounded-lg border border-sky-200/30 bg-white/80 p-6 opacity-0 shadow-md backdrop-blur-md">
          <h4 className="mb-4 text-lg font-semibold text-sky-900">
            {recommendedMarkets.type === "similar"
              ? "Similar Markets"
              : "Popular Markets"}
          </h4>

          <div className="flex flex-col gap-4">
            {recommendedMarkets.markets.map((market, index) => {
              const stat = stats?.find((s) => s.marketId === market.marketId);

              return (
                <div
                  key={`market-${market.marketId}`}
                  className="animate-pop-in opacity-0"
                  style={{
                    animationDelay: `${200 * (index + 1)}ms`,
                  }}
                >
                  <MarketCard
                    key={market.marketId}
                    market={market}
                    numParticipants={stat?.participants}
                    liquidity={stat?.liquidity}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default SimilarMarketsSection;
