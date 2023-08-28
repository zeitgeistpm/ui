import type { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ScalarRangeType } from "@zeitgeistpm/sdk-next";
import MarketCard from "components/markets/market-card";
import Skeleton from "components/ui/Skeleton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { useSimilarMarkets } from "lib/hooks/queries/useSimilarMarkets";
import { range } from "lodash-es";

export const SimilarMarketsSection = ({
  market,
  limit,
}: {
  market?: FullMarketFragment;
  limit?: number;
}) => {
  const similarMarkets = useSimilarMarkets(market?.marketId, limit ?? 2);

  const hasSimilarMarkets = Boolean(similarMarkets?.data?.length);

  const stats = useMarketsStats(
    similarMarkets?.data?.map((m) => m.marketId) ?? [],
    {
      enabled: hasSimilarMarkets,
    },
  );

  const isLoading =
    (!similarMarkets.isFetched &&
      (similarMarkets.isFetching || similarMarkets.isLoading)) ||
    (hasSimilarMarkets &&
      ((!stats.isFetched && stats.isFetching) || stats.isLoading));

  return (
    <div className="flex flex-col gap-4 relative z-[-1]">
      {!isLoading && (
        <>
          {hasSimilarMarkets && <h4 className="mb-4">Similar Markets</h4>}

          {similarMarkets?.data?.map((market, index) => {
            const stat = stats?.data?.find(
              (s) => s.marketId === market.marketId,
            );

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
                className="shadow-lg rounded-xl opacity-0 animate-pop-in"
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
                  key={`market-${market.marketId}`}
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
