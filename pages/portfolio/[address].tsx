import { Tab } from "@headlessui/react";
import { getIndexOf } from "@zeitgeistpm/sdk-next";
import { PortfolioBreakdown } from "components/portfolio/Breakdown";
import {
  MarketPositions,
  MarketPositionsSkeleton,
} from "components/portfolio/MarketPositions";
import InfoBoxes from "components/ui/InfoBoxes";
import { usePortfolioPositions } from "lib/hooks/queries/usePortfolioPositions";
import { useZtgInfo } from "lib/hooks/queries/useZtgInfo";
import { groupBy, range } from "lodash-es";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

const Portfolio: NextPage = observer(() => {
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  const { markets, subsidy, breakdown } = usePortfolioPositions(address);

  const { data: ztgPrice } = useZtgInfo();

  const marketPositionsByMarket = useMemo(
    () => markets && groupBy(markets, (position) => position.market.marketId),
    [markets],
  );

  const subsidyPositionsByMarket = useMemo(
    () => subsidy && groupBy(subsidy, (position) => position.market.marketId),
    [subsidy],
  );

  return (
    <>
      <InfoBoxes />

      <h2 className="header text-xs font-bold mb-8">Portfolio</h2>

      <div className="mb-12">
        <h3 className="font-bold text-xl mb-4">Breakdown</h3>
        <PortfolioBreakdown
          {...(breakdown ?? {
            loading: true,
          })}
        />
      </div>

      <div className="mb-12">
        <h3 className="text-3xl mb-6 text-center">Predictions</h3>

        <Tab.Group>
          <Tab.List className="flex center mb-14">
            <Tab className="text-lg px-4 ui-selected:font-bold ui-selected:text-gray-800 text-gray-500 transition-all">
              By Markets
            </Tab>
            <Tab className="text-lg px-4 ui-selected:font-bold ui-selected:text-gray-800 text-gray-500 transition-all">
              Subsidy
            </Tab>
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              {!marketPositionsByMarket || !ztgPrice
                ? range(0, 8).map((i) => (
                    <MarketPositionsSkeleton className="mb-14" key={i} />
                  ))
                : Object.values(marketPositionsByMarket).map(
                    (marketPositions) => {
                      const market = marketPositions[0].market;

                      marketPositions = marketPositions.filter((position) =>
                        position.userBalance.gt(0),
                      );

                      if (
                        market.status === "Resolved" &&
                        market.marketType.categorical
                      ) {
                        marketPositions = marketPositions.filter(
                          (position) =>
                            getIndexOf(position.assetId) ===
                            Number(market.resolvedOutcome),
                        );
                      }

                      if (marketPositions.length === 0) return null;

                      return (
                        <MarketPositions
                          key={market.marketId}
                          className="mb-14 border-b-4 border-gray-200"
                          market={market}
                          usdZtgPrice={ztgPrice.price}
                          positions={marketPositions
                            .filter((position) => position.userBalance.gt(0))
                            .map((position) => ({
                              outcome: position.outcome,
                              assetId: position.assetId,
                              price: position.price,
                              balance: position.userBalance,
                              changePercentage: position.changePercentage,
                            }))}
                        />
                      );
                    },
                  )}
            </Tab.Panel>

            <Tab.Panel>
              {!subsidyPositionsByMarket || !ztgPrice
                ? range(0, 8).map((i) => (
                    <MarketPositionsSkeleton className="mb-14" key={i} />
                  ))
                : Object.values(subsidyPositionsByMarket).map(
                    (subsidyPositions) => {
                      const market = subsidyPositions[0].market;
                      return (
                        <MarketPositions
                          key={market.marketId}
                          className="mb-14 border-b-4 border-gray-200"
                          market={market}
                          usdZtgPrice={ztgPrice.price}
                          positions={subsidyPositions
                            .filter((position) => position.userBalance.gt(0))
                            .map((position) => ({
                              outcome: position.outcome,
                              assetId: position.assetId,
                              price: position.price,
                              balance: position.userBalance,
                              changePercentage: position.changePercentage,
                            }))}
                        />
                      );
                    },
                  )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
  );
});

export default Portfolio;
