import { Tab } from "@headlessui/react";
import { getIndexOf } from "@zeitgeistpm/sdk-next";
import BadgesList from "components/avatar/BadgesList";
import BondsTable from "components/portfolio/BondsTable";
import { PortfolioBreakdown } from "components/portfolio/Breakdown";
import CurrenciesTable from "components/portfolio/CurrenciesTable";
import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import HistoryTabGroup from "components/portfolio/HistoryTabGroup";
import {
  MarketPositions,
  MarketPositionsSkeleton,
} from "components/portfolio/MarketPositions";
import PortfolioIdentity from "components/portfolio/PortfolioIdentity";
import { Loader } from "components/ui/Loader";
import SubTabsList from "components/ui/SubTabsList";
import PortfolioLayout from "layouts/PortfolioLayout";
import { NextPageWithLayout } from "layouts/types";
import { usePortfolioPositions } from "lib/hooks/queries/usePortfolioPositions";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useCrossChainApis } from "lib/state/cross-chain";
import { useDelayQueue } from "lib/state/delay-queue";
import { isValidPolkadotAddress } from "lib/util";
import { assetsAreEqual } from "lib/util/assets-are-equal";
import { groupBy, range } from "lodash-es";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useMemo } from "react";

type MainTabItem =
  | "Predictions"
  | "Balances"
  | "Markets"
  | "Badges"
  | "History";

const mainTabItems: MainTabItem[] = [
  "Predictions",
  ...(process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true" ? ["Balances"] : []),
  "Markets",
  "Badges",
  "History",
] as MainTabItem[];

type MarketsTabItem = "Created Markets" | "Liquidity";
const marketsTabItems: MarketsTabItem[] = ["Created Markets", "Liquidity"];

const Portfolio: NextPageWithLayout = () => {
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  //init cross chain apis early
  useCrossChainApis();

  const { items } = useDelayQueue();

  const [mainTabSelection, setMainTabSelection] =
    useQueryParamState<MainTabItem>("mainTab");

  const [marketsTabSelection, setMarketsTabSelection] =
    useQueryParamState<MarketsTabItem>("marketsTab");

  const { markets, subsidy, breakdown } = usePortfolioPositions(address);

  const { data: ztgPrice } = useZtgPrice();

  const marketPositionsByMarket = useMemo(
    () => markets && groupBy(markets, (position) => position.market.marketId),
    [markets],
  );

  const subsidyPositionsByMarket = useMemo(
    () => subsidy && groupBy(subsidy, (position) => position.market.marketId),
    [subsidy],
  );

  if (!address) {
    return null;
  }

  if (isValidPolkadotAddress(address) === false) {
    return <NotFoundPage />;
  }

  const ownedAssetIds = Object.values(marketPositionsByMarket ?? {})
    .flat()
    .map((p) => p.assetId);

  const newAssetsQueued = items.filter(
    (item) =>
      item.metadata?.address === address &&
      ownedAssetIds.some(
        (assetId) =>
          item.metadata?.assetId &&
          assetsAreEqual(assetId, item.metadata.assetId),
      ) === false,
  );

  const isPortfolioIndexing =
    marketPositionsByMarket && newAssetsQueued.length !== 0;

  return (
    <>
      {address && <PortfolioIdentity address={address} />}
      <div className="mb-[40px]">
        <PortfolioBreakdown
          {...(breakdown ?? {
            loading: true,
          })}
        />
      </div>
      <div className="mb-12">
        <Tab.Group
          defaultIndex={0}
          selectedIndex={
            mainTabSelection && mainTabItems.indexOf(mainTabSelection)
          }
          onChange={(index) => setMainTabSelection(mainTabItems[index])}
        >
          <div className="overflow-auto border-b border-sky-200">
            <Tab.List className="flex sm:justify-center mb-4">
              {[
                "Predictions",
                ...(process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true"
                  ? ["Balances"]
                  : []),
                "Markets",
                "Badges",
                "History",
              ].map((title, index) => (
                <Tab className="px-4" key={index}>
                  {({ selected }) => (
                    <div
                      className={
                        selected
                          ? "font-semibold text-black transition-all"
                          : "text-sky-600 transition-all"
                      }
                    >
                      {title}
                    </div>
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>

          <Tab.Panels>
            <Tab.Panel className="mt-[40px]">
              {isPortfolioIndexing && (
                <div className="flex w-full items-center justify-center gap-5 bg-info p-4 mb-[40px] text-sm flex-wrap">
                  <Loader loading={true} className="h-9 w-9" variant={"Info"} />
                  <div className="text-center">
                    New portfolio positions are being indexed
                  </div>
                </div>
              )}
              {!marketPositionsByMarket || !ztgPrice ? (
                range(0, 8).map((i) => (
                  <MarketPositionsSkeleton className="mb-14" key={i} />
                ))
              ) : Object.values(marketPositionsByMarket).length > 0 ? (
                Object.values(marketPositionsByMarket).map(
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

                    if (marketPositions.length === 0) return <></>;

                    return (
                      <MarketPositions
                        key={market.marketId}
                        className="mb-14 border-b-4 border-gray-200"
                        market={market}
                        usdZtgPrice={ztgPrice}
                        positions={marketPositions.filter((position) =>
                          position.userBalance.gt(0),
                        )}
                      />
                    );
                  },
                )
              ) : (
                <EmptyPortfolio
                  headerText="You don't have any assets"
                  bodyText="View markets to trade assets"
                  buttonText="View Markets"
                  buttonLink="/markets"
                />
              )}
            </Tab.Panel>
            {process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true" && (
              <Tab.Panel>
                {address && <CurrenciesTable address={address} />}
              </Tab.Panel>
            )}
            <Tab.Panel>
              <Tab.Group
                defaultIndex={0}
                selectedIndex={
                  marketsTabSelection &&
                  marketsTabItems.indexOf(marketsTabSelection)
                }
                onChange={(index) =>
                  setMarketsTabSelection(marketsTabItems[index])
                }
              >
                <div className="overflow-auto">
                  <SubTabsList titles={marketsTabItems} />
                </div>
                <Tab.Panels>
                  <Tab.Panel>
                    {address && <BondsTable address={address} />}
                  </Tab.Panel>
                  <Tab.Panel>
                    {!subsidyPositionsByMarket || !ztgPrice ? (
                      range(0, 8).map((i) => (
                        <MarketPositionsSkeleton className="mb-14" key={i} />
                      ))
                    ) : Object.values(subsidyPositionsByMarket).length > 0 ? (
                      Object.values(subsidyPositionsByMarket).map(
                        (subsidyPositions) => {
                          const market = subsidyPositions[0].market;
                          return (
                            <MarketPositions
                              key={market.marketId}
                              className="mb-14 border-b-4 border-gray-200"
                              market={market}
                              usdZtgPrice={ztgPrice}
                              positions={subsidyPositions.filter((position) =>
                                position.userBalance.gt(0),
                              )}
                            />
                          );
                        },
                      )
                    ) : (
                      <EmptyPortfolio
                        headerText="You don't have any liquidity"
                        bodyText="View liquidity pools to find places to provide liquidity"
                        buttonText="View Pools"
                        buttonLink="/liquidity"
                      />
                    )}
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </Tab.Panel>
            <Tab.Panel className="mt-[40px]">
              {address && <BadgesList address={address} />}
            </Tab.Panel>
            <Tab.Panel>
              {address && <HistoryTabGroup address={address} />}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
  );
};

Portfolio.Layout = PortfolioLayout;

export default Portfolio;
