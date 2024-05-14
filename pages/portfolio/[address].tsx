import { Tab } from "@headlessui/react";
import { getIndexOf } from "@zeitgeistpm/sdk";
import BadgesList from "components/avatar/BadgesList";
import OrdersTable from "components/orderbook/OrdersTable";
import AccountPoolsTable from "components/portfolio/AccountPoolsTable";
import BondsTable from "components/portfolio/BondsTable";
import { PortfolioBreakdown } from "components/portfolio/Breakdown";
import CourtTabGroup from "components/portfolio/CourtTabGroup";
import CreatorFeePayouts from "components/portfolio/CreatorFeePayouts";
import CurrenciesTable from "components/portfolio/CurrenciesTable";
import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import HistoryTabGroup from "components/portfolio/HistoryTabGroup";
import {
  MarketPositions,
  MarketPositionsSkeleton,
} from "components/portfolio/MarketPositions";
import PortfolioIdentity from "components/portfolio/PortfolioIdentity";
import SubTabsList from "components/ui/SubTabsList";
import PortfolioLayout from "layouts/PortfolioLayout";
import { NextPageWithLayout } from "layouts/types";
import { usePortfolioPositions } from "lib/hooks/queries/usePortfolioPositions";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useCrossChainApis } from "lib/state/cross-chain";
import { isValidPolkadotAddress } from "lib/util";
import { groupBy, range } from "lodash-es";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useMemo } from "react";

type MainTabItem =
  | "Predictions"
  | "Balances"
  | "Markets"
  | "Badges"
  | "History"
  | "Court";

const mainTabItems: MainTabItem[] = [
  "Predictions",
  ...(process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true" ? ["Balances"] : []),
  "Markets",
  "Badges",
  "History",
  "Court",
] as MainTabItem[];

type MarketsTabItem =
  | "Created Markets"
  | "Liquidity"
  | "Creator Fee Payouts"
  | "Orders";
const marketsTabItems: MarketsTabItem[] = [
  "Created Markets",
  "Liquidity",
  "Creator Fee Payouts",
  "Orders",
];

const Portfolio: NextPageWithLayout = () => {
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  //init cross chain apis early
  useCrossChainApis();

  const [mainTabSelection, setMainTabSelection] =
    useQueryParamState<MainTabItem>("mainTab");

  const [marketsTabSelection, setMarketsTabSelection] =
    useQueryParamState<MarketsTabItem>("marketsTab");

  const { markets, breakdown } = usePortfolioPositions(address);

  const { data: ztgPrice } = useZtgPrice();

  const marketPositionsByMarket = useMemo(
    () => markets && groupBy(markets, (position) => position.market.marketId),
    [markets],
  );

  if (!address) {
    return null;
  }

  if (isValidPolkadotAddress(address) === false) {
    return <NotFoundPage />;
  }

  return (
    <div className="mt-8 overflow-hidden">
      {address && <PortfolioIdentity address={address} />}
      <div className="mb-12">
        <PortfolioBreakdown
          address={address}
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
            <Tab.List className="mb-4 flex">
              {[
                "Predictions",
                ...(process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true"
                  ? ["Balances"]
                  : []),
                "Markets",
                "Badges",
                "History",
                "Court",
              ].map((title, index) => (
                <Tab className="text-sm sm:text-xl" key={index}>
                  {({ selected }) => (
                    <div
                      className={`${
                        selected
                          ? "font-semibold text-black transition-all"
                          : "text-sky-600 transition-all"
                      } ${index === 0 ? "px-0 pr-4" : "px-4"}`}
                    >
                      {title}
                    </div>
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>

          <Tab.Panels>
            <Tab.Panel className="mt-12">
              {!marketPositionsByMarket || !ztgPrice ? (
                range(0, 8).map((i) => (
                  <MarketPositionsSkeleton className="mb-8" key={i} />
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
                        className="mb-8"
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
                    <AccountPoolsTable address={address} />
                  </Tab.Panel>
                  <Tab.Panel>
                    {address && <CreatorFeePayouts address={address} />}
                  </Tab.Panel>
                  <Tab.Panel>
                    {address && (
                      <OrdersTable
                        where={{
                          makerAccountId_eq: address,
                        }}
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
            <Tab.Panel>
              {address && <CourtTabGroup address={address} />}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

Portfolio.Layout = PortfolioLayout;

export default Portfolio;
