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
    <div className="relative z-[-1] flex flex-col gap-4">
      {!isLoading && (
        <>
          {recommendedMarkets && (
            <h4
              className="mb-4 animate-pop-in opacity-0"
              style={{
                animationDelay: `200ms`,
              }}
            >
              {recommendedMarkets.type === "similar"
                ? "Similar Markets"
                : "Popular Markets"}
            </h4>
          )}

          {recommendedMarkets?.markets.map((market, index) => {
            const stat = stats?.find((s) => s.marketId === market.marketId);

            let { categorical, scalar } = market.marketType ?? {};
            if (categorical === null) {
              categorical = "";
            }
            const filteredScalar =
              scalar?.filter((item): item is string => item !== null) ?? [];
            const marketType = { categorical, scalar: filteredScalar };
            const scalarType = market.scalarType as ScalarRangeType;

            return (
              <div
                key={`market-${market.marketId}`}
                className="animate-pop-in rounded-xl opacity-0 shadow-lg"
                style={{
                  animationDelay: `${200 * (index + 1)}ms`,
                }}
              >
                <MarketCard
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                  question={market.question ?? ""}
                  creation={market.creation}
                  creator={market.creator}
                  img={market.img ?? ""}
                  prediction={market.prediction}
                  endDate={market.period.end}
                  marketType={marketType}
                  scalarType={scalarType}
                  pool={market.pool ?? null}
                  neoPool={market?.neoPool}
                  status={market.status}
                  baseAsset={market.baseAsset}
                  volume={new Decimal(market.pool?.volume ?? 0)
                    .div(ZTG)
                    .toNumber()}
                  tags={
                    market.tags?.filter((tag): tag is string => tag !== null) ??
                    []
                  }
                  numParticipants={stat?.participants}
                  liquidity={stat?.liquidity}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default SimilarMarketsSection;
