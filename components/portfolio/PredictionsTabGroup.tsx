import { Tab } from "@headlessui/react";
import SubTabsList from "components/ui/SubTabsList";
import { usePortfolioPositions } from "lib/hooks/queries/usePortfolioPositions";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { range } from "lodash-es";
import { useMemo } from "react";
import { MarketPositions, MarketPositionsSkeleton } from "./MarketPositions";
import { groupBy } from "lodash-es";
import EmptyPortfolio from "./EmptyPortfolio";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { isCombinatorialToken } from "lib/types/combinatorial";

const getAssetIndex = (assetId: any): number => {
  if (assetId.CategoricalOutcome) {
    return assetId.CategoricalOutcome[1];
  }
  if (assetId.ScalarOutcome) {
    return assetId.ScalarOutcome[1];
  }
  return -1;
};

type PredictionsSubTab = "Markets" | "Multi-Markets";

const predictionsSubTabs: PredictionsSubTab[] = ["Markets", "Multi-Markets"];

export const PredictionsTabGroup = ({ address }: { address: string }) => {
  const [predictionsTabSelection, setPredictionsTabSelection] =
    useQueryParamState<PredictionsSubTab>("predictionsTab");

  const { markets, breakdown } = usePortfolioPositions(address);
  const { data: ztgPrice } = useZtgPrice();

  const { regularMarketPositions, multiMarketPositions } = useMemo(() => {
    if (!markets) {
      return { regularMarketPositions: null, multiMarketPositions: null };
    }

    const regular: typeof markets = [];
    const multi: typeof markets = [];

    markets.forEach((position) => {
      if (
        position.isMultiMarket &&
        position.underlyingMarketIds &&
        position.underlyingMarketIds.length > 1
      ) {
        multi.push(position);
      } else {
        regular.push(position);
      }
    });

    return { regularMarketPositions: regular, multiMarketPositions: multi };
  }, [markets]);

  const regularMarketsByMarket = useMemo(
    () =>
      regularMarketPositions &&
      groupBy(regularMarketPositions, (position) => position.market.marketId),
    [regularMarketPositions],
  );

  const multiMarketsByMarket = useMemo(
    () =>
      multiMarketPositions &&
      groupBy(multiMarketPositions, (position) => position.market.marketId),
    [multiMarketPositions],
  );

  const renderMarketPositions = (
    marketPositionsByMarket: typeof regularMarketsByMarket,
    isMultiMarketTab: boolean,
  ) => {
    if (!marketPositionsByMarket || !ztgPrice) {
      return range(0, 4).map((i) => (
        <MarketPositionsSkeleton className="mb-6" key={i} />
      ));
    }

    if (Object.values(marketPositionsByMarket).length === 0) {
      return (
        <EmptyPortfolio
          headerText={`You don't have any ${isMultiMarketTab ? "multi-market" : "market"} positions`}
          bodyText="View markets to trade assets"
          buttonText="View Markets"
          buttonLink="/markets"
        />
      );
    }

    return Object.values(marketPositionsByMarket).map((marketPositions) => {
      const market = marketPositions[0].market;

      // For multi-market positions ready for redemption, check if winning outcome balance is 0
      const isMultiMarket = marketPositions[0]?.isMultiMarket;
      const canRedeem = marketPositions[0]?.canRedeem;

      if (isMultiMarket && canRedeem) {
        const allMarketsResolved = market.status === "Resolved";

        if (market.resolvedOutcome !== null && allMarketsResolved) {
          const isParentScalar = (market.neoPool as any)?._debug
            ?.isParentScalar;
          const isChildScalar = (market.neoPool as any)?._debug?.isChildScalar;

          // Find positions with winning outcomes
          const winningPositions = marketPositions.filter((position) => {
            if (isCombinatorialToken(position.assetId)) {
              const tokenIndex = market.outcomeAssets?.findIndex((asset) =>
                asset.includes((position.assetId as any).CombinatorialToken),
              );

              if (tokenIndex === -1) return false;

              // For parent categorical + child scalar
              if (!isParentScalar && isChildScalar) {
                const parentIndex = Math.floor(tokenIndex / 2);
                return parentIndex === Number(market.resolvedOutcome);
              }

              // For both categorical: standard index match
              return tokenIndex === Number(market.resolvedOutcome);
            }
            return false;
          });

          // If all winning balances are zero, hide all positions
          const allWinningBalancesZero =
            winningPositions.length > 0 &&
            winningPositions.every((pos) => pos.userBalance.eq(0));

          const noWinningPositions =
            winningPositions.length === 0 && marketPositions.length > 0;

          if (
            allMarketsResolved &&
            (allWinningBalancesZero || noWinningPositions)
          ) {
            return null;
          }
        }
      }

      // Filter resolved categorical markets (non-multi-market logic)
      let filteredPositions = marketPositions;
      if (
        !isMultiMarket &&
        market.status === "Resolved" &&
        market.marketType.categorical
      ) {
        filteredPositions = marketPositions.filter((position) => {
          if (isCombinatorialToken(position.assetId)) {
            return true; // Include all combinatorial tokens for resolved markets
          }
          // Handle regular market outcome assets
          return (
            getAssetIndex(position.assetId) === Number(market.resolvedOutcome)
          );
        });
      }

      if (filteredPositions.length === 0) return null;

      return (
        <MarketPositions
          key={market.marketId}
          className="mb-6"
          market={market}
          usdZtgPrice={ztgPrice}
          positions={filteredPositions}
        />
      );
    });
  };

  return (
    <Tab.Group
      defaultIndex={0}
      selectedIndex={
        predictionsTabSelection &&
        predictionsSubTabs.indexOf(predictionsTabSelection)
      }
      onChange={(index) =>
        setPredictionsTabSelection(predictionsSubTabs[index])
      }
    >
      <div className="overflow-auto">
        <SubTabsList titles={predictionsSubTabs} />
      </div>

      <Tab.Panels>
        {/* Regular Markets Tab */}
        <Tab.Panel>
          {renderMarketPositions(regularMarketsByMarket, false)}
        </Tab.Panel>

        {/* Multi-Markets Tab */}
        <Tab.Panel>
          {renderMarketPositions(multiMarketsByMarket, true)}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};
