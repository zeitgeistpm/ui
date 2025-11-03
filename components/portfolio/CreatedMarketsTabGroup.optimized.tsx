import { Tab } from "@headlessui/react";
import SubTabsList from "components/ui/SubTabsList";
import { useCreatedMarketsTabData } from "lib/hooks/queries/portfolio/usePortfolioTabs";
import { useMemo } from "react";
import { range } from "lodash-es";
import EmptyPortfolio from "./EmptyPortfolio";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import MarketCard from "components/markets/MarketCard";

type CreatedMarketsSubTab = "Markets" | "Multi-Markets";

const createdMarketsSubTabs: CreatedMarketsSubTab[] = [
  "Markets",
  "Multi-Markets",
];

const MarketCardSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="h-48 rounded-lg bg-gray-200"></div>
  </div>
);

/**
 * Optimized CreatedMarketsTabGroup with lazy loading
 * Only fetches pool data when tab is active
 */
export const CreatedMarketsTabGroup = ({ address }: { address: string }) => {
  const [createdMarketsTabSelection, setCreatedMarketsTabSelection] =
    useQueryParamState<CreatedMarketsSubTab>("createdMarketsTab");

  // Fetch created markets data only when tab is active
  const { regularMarketPools, multiMarketPools, isLoading } =
    useCreatedMarketsTabData(address, true);

  const renderMarketPools = (
    pools: typeof regularMarketPools,
    isMultiMarketTab: boolean,
  ) => {
    if (isLoading || !pools) {
      return range(0, 3).map((i) => (
        <MarketCardSkeleton className="mb-4" key={i} />
      ));
    }

    if (pools.length === 0) {
      return (
        <EmptyPortfolio
          headerText={`You haven't created any ${isMultiMarketTab ? "multi-markets" : "markets"}`}
          bodyText="Create a market to start earning trading fees"
          buttonText="Create Market"
          buttonLink="/create"
        />
      );
    }

    return pools.map((pool) => {
      // Render appropriate market card based on pool type
      if (pool.isMultiMarket) {
        // Multi-market card
        return (
          <div key={pool.poolId} className="mb-4">
            <div className="rounded-lg border border-sky-200/30 bg-white/80 p-4 shadow-sm backdrop-blur-md">
              <h3 className="mb-2 font-semibold">
                Multi-Market Pool #{pool.poolId}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Markets:</span>{" "}
                  {pool.marketIds?.join(", ")}
                </div>
                <div>
                  <span className="text-gray-600">Liquidity:</span>{" "}
                  {pool.liquidity || "N/A"}
                </div>
                <div>
                  <span className="text-gray-600">Volume:</span>{" "}
                  {pool.volume || "N/A"}
                </div>
                <div>
                  <span className="text-gray-600">Fees Earned:</span>{" "}
                  {pool.feesEarned || "N/A"}
                </div>
              </div>
              <a
                href={`/multi-market/${pool.poolId}`}
                className="mt-3 inline-block text-sky-600 hover:text-sky-700"
              >
                View Pool →
              </a>
            </div>
          </div>
        );
      } else {
        // Regular market card
        return (
          <div key={pool.poolId} className="mb-4">
            <div className="rounded-lg border border-sky-200/30 bg-white/80 p-4 shadow-sm backdrop-blur-md">
              <h3 className="mb-2 font-semibold">Market Pool #{pool.poolId}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Market ID:</span>{" "}
                  {pool.marketId || "N/A"}
                </div>
                <div>
                  <span className="text-gray-600">Liquidity:</span>{" "}
                  {pool.liquidity || "N/A"}
                </div>
                <div>
                  <span className="text-gray-600">Volume:</span>{" "}
                  {pool.volume || "N/A"}
                </div>
                <div>
                  <span className="text-gray-600">Fees Earned:</span>{" "}
                  {pool.feesEarned || "N/A"}
                </div>
              </div>
              {pool.marketId && (
                <a
                  href={`/markets/${pool.marketId}`}
                  className="mt-3 inline-block text-sky-600 hover:text-sky-700"
                >
                  View Market →
                </a>
              )}
            </div>
          </div>
        );
      }
    });
  };

  return (
    <Tab.Group
      defaultIndex={0}
      selectedIndex={
        createdMarketsTabSelection &&
        createdMarketsSubTabs.indexOf(createdMarketsTabSelection)
      }
      onChange={(index) =>
        setCreatedMarketsTabSelection(createdMarketsSubTabs[index])
      }
    >
      <SubTabsList titles={createdMarketsSubTabs} />
      <Tab.Panels>
        <Tab.Panel>{renderMarketPools(regularMarketPools, false)}</Tab.Panel>
        <Tab.Panel>{renderMarketPools(multiMarketPools, true)}</Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};

export default CreatedMarketsTabGroup;
