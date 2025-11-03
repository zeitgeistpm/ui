/**
 * Optimized Portfolio Page
 *
 * This file replaces the original [address].tsx with performance optimizations:
 * - Tab-based lazy loading (only loads active tab data)
 * - Lightweight header with summary data only
 * - P&L calculations on demand
 * - Built-in pagination for large portfolios
 * - React Query caching for all data
 *
 * To use this optimized version:
 * 1. Rename [address].tsx to [address].old.tsx
 * 2. Rename this file to [address].tsx
 * 3. Update component imports in other files
 */

import { Tab } from "@headlessui/react";
import PortfolioHeader from "components/portfolio/PortfolioHeader";
import PrimaryTabsList from "components/ui/PrimaryTabsList";
import PortfolioLayout from "layouts/PortfolioLayout";
import { NextPageWithLayout } from "layouts/types";
import { usePortfolioSummary } from "lib/hooks/queries/portfolio";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useCrossChainApis } from "lib/state/cross-chain";
import { isValidPolkadotAddress } from "lib/util";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useMemo, lazy, Suspense } from "react";

// Lazy load tab components with loading states
const PredictionsTabGroup = lazy(
  () => import("components/portfolio/PredictionsTabGroup.optimized"),
);
const CreatedMarketsTabGroup = lazy(
  () => import("components/portfolio/CreatedMarketsTabGroup.optimized"),
);
const CurrenciesTable = lazy(
  () => import("components/portfolio/CurrenciesTable"),
);
const HistoryTabGroup = lazy(
  () => import("components/portfolio/HistoryTabGroup"),
);
const CourtTabGroup = lazy(() => import("components/portfolio/CourtTabGroup"));

// Loading skeleton component
const TabLoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="h-48 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200"></div>
      </div>
    ))}
  </div>
);

// Tab error boundary component
const TabErrorFallback = ({ error }: { error: Error }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-6">
    <h3 className="mb-2 font-semibold text-red-800">
      Failed to load tab content
    </h3>
    <p className="text-sm text-red-600">{error.message}</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Reload Page
    </button>
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

const Portfolio: NextPageWithLayout = () => {
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  // Initialize cross chain APIs early
  useCrossChainApis();

  const [mainTabSelection, setMainTabSelection] =
    useQueryParamState<MainTabItem>("mainTab");

  // Only fetch summary data for the header - much faster than full portfolio data
  const summary = usePortfolioSummary(address, { enabled: Boolean(address) });

  const mainTabItems = getMainTabItems();

  // Calculate selected tab index
  const selectedIndex = useMemo(() => {
    if (!mainTabSelection) return 0;
    const index = mainTabItems.indexOf(mainTabSelection);
    return index >= 0 ? index : 0;
  }, [mainTabSelection, mainTabItems]);

  // Early returns for invalid states
  if (!address) {
    return null;
  }

  if (isValidPolkadotAddress(address) === false) {
    return <NotFoundPage />;
  }

  return (
    <div className="container-fluid mt-6 overflow-hidden">
      {/* Optimized header that only loads summary data */}
      <PortfolioHeader
        address={address}
        {...(summary || {
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
          onChange={(index) => {
            setMainTabSelection(mainTabItems[index]);
          }}
        >
          <PrimaryTabsList titles={mainTabItems} />

          <Tab.Panels>
            {/* Predictions Tab */}
            <Tab.Panel>
              {selectedIndex === 0 && (
                <Suspense fallback={<TabLoadingSkeleton />}>
                  <PredictionsTabGroup address={address} />
                </Suspense>
              )}
            </Tab.Panel>

            {/* Balances Tab (Cross-chain only) */}
            {process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true" && (
              <Tab.Panel>
                {selectedIndex === 1 && (
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <CurrenciesTable address={address} />
                  </Suspense>
                )}
              </Tab.Panel>
            )}

            {/* Created Markets Tab */}
            <Tab.Panel>
              {selectedIndex ===
                (process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true"
                  ? 2
                  : 1) && (
                <Suspense fallback={<TabLoadingSkeleton />}>
                  <CreatedMarketsTabGroup address={address} />
                </Suspense>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

Portfolio.Layout = PortfolioLayout;

export default Portfolio;
