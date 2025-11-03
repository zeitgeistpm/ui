import { Tab } from "@headlessui/react";
import PortfolioHeader from "components/portfolio/PortfolioHeader";
import PrimaryTabsList from "components/ui/PrimaryTabsList";
import PortfolioLayout from "layouts/PortfolioLayout";
import { NextPageWithLayout } from "layouts/types";
import { usePortfolioSummary } from "lib/hooks/queries/portfolio/usePortfolioSummary";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useCrossChainApis } from "lib/state/cross-chain";
import { isValidPolkadotAddress } from "lib/util";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useMemo, Suspense } from "react";

// Lazy load tab components - only load when user switches to that tab
const PredictionsTabGroupOptimized = dynamic(
  () => import("components/portfolio/PredictionsTabGroup.optimized"),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton />,
  },
);

const CreatedMarketsTabGroupOptimized = dynamic(
  () => import("components/portfolio/CreatedMarketsTabGroup.optimized"),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton />,
  },
);

const CurrenciesTableOptimized = dynamic(
  () => import("components/portfolio/CurrenciesTable"),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton />,
  },
);

const HistoryTabGroup = dynamic(
  () => import("components/portfolio/HistoryTabGroup"),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton />,
  },
);

const CourtTabGroup = dynamic(
  () => import("components/portfolio/CourtTabGroup"),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton />,
  },
);

// Loading skeleton for tabs
const TabLoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="mb-4 h-48 rounded-lg bg-gray-200"></div>
    <div className="mb-4 h-48 rounded-lg bg-gray-200"></div>
    <div className="h-48 rounded-lg bg-gray-200"></div>
  </div>
);

type MainTabItem = "Predictions" | "Balances" | "Created Markets";

const getMainTabItems = (): MainTabItem[] => {
  return [
    "Predictions",
    ...(process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true"
      ? ["Balances" as MainTabItem]
      : []),
    "Created Markets",
  ];
};

/**
 * Optimized Portfolio page with tab-based lazy loading
 * Only loads data for the active tab, reducing initial load time significantly
 */
const PortfolioOptimized: NextPageWithLayout = () => {
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  // Initialize cross chain APIs early
  useCrossChainApis();

  const [mainTabSelection, setMainTabSelection] =
    useQueryParamState<MainTabItem>("mainTab");

  // Only fetch summary data for the header - lightweight query
  const summary = usePortfolioSummary(address);

  const mainTabItems = getMainTabItems();

  // Calculate selected index
  const selectedIndex = useMemo(() => {
    if (!mainTabSelection) return 0;
    const index = mainTabItems.indexOf(mainTabSelection);
    return index >= 0 ? index : 0;
  }, [mainTabSelection, mainTabItems]);

  if (!address) {
    return null;
  }

  if (isValidPolkadotAddress(address) === false) {
    return <NotFoundPage />;
  }

  return (
    <div className="container-fluid mt-6 overflow-hidden">
      {/* Header only loads summary data */}
      <PortfolioHeader
        address={address}
        {...(summary ?? {
          loading: true,
          total: { value: 0, changePercentage: 0 },
          tradingPositions: { value: 0, changePercentage: 0 },
          subsidy: { value: 0, changePercentage: 0 },
          bonded: { value: 0, changePercentage: 0 },
        })}
      />

      <div className="mb-6">
        <Tab.Group
          defaultIndex={0}
          selectedIndex={selectedIndex}
          onChange={(index) => setMainTabSelection(mainTabItems[index])}
        >
          <PrimaryTabsList titles={mainTabItems} />

          <Tab.Panels>
            <Tab.Panel>
              <Suspense fallback={<TabLoadingSkeleton />}>
                {/* Only render and load data when tab is selected */}
                {selectedIndex === 0 && (
                  <PredictionsTabGroupOptimized address={address} />
                )}
              </Suspense>
            </Tab.Panel>

            {process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true" && (
              <Tab.Panel>
                <Suspense fallback={<TabLoadingSkeleton />}>
                  {selectedIndex === 1 && address && (
                    <CurrenciesTableOptimized address={address} />
                  )}
                </Suspense>
              </Tab.Panel>
            )}

            <Tab.Panel>
              <Suspense fallback={<TabLoadingSkeleton />}>
                {selectedIndex ===
                  (process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true"
                    ? 2
                    : 1) && (
                  <CreatedMarketsTabGroupOptimized address={address} />
                )}
              </Suspense>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

PortfolioOptimized.Layout = PortfolioLayout;

export default PortfolioOptimized;
