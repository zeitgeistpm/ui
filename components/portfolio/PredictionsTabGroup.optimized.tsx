import { Tab } from "@headlessui/react";
import SubTabsList from "components/ui/SubTabsList";
import { usePredictionsTabData } from "lib/hooks/queries/portfolio/usePortfolioTabs";
import { usePositionPnL } from "lib/hooks/queries/portfolio/usePositionPnL";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { range } from "lodash-es";
import { useMemo, useState, useCallback } from "react";
import { MarketPositions, MarketPositionsSkeleton } from "./MarketPositions";
import EmptyPortfolio from "./EmptyPortfolio";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useInView } from "react-intersection-observer";

type PredictionsSubTab = "Markets" | "Multi-Markets";

const predictionsSubTabs: PredictionsSubTab[] = ["Markets", "Multi-Markets"];

// Pagination configuration
const POSITIONS_PER_PAGE = 10;

/**
 * Optimized PredictionsTabGroup with:
 * - Lazy data loading
 * - Pagination for large lists
 * - P&L calculations on demand
 */
export const PredictionsTabGroup = ({ address }: { address: string }) => {
  const [predictionsTabSelection, setPredictionsTabSelection] =
    useQueryParamState<PredictionsSubTab>("predictionsTab");

  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0]));

  // Fetch tab-specific data only
  const { positions, positionsByMarket, isLoading } = usePredictionsTabData(
    address,
    true,
  );
  const { data: ztgPrice } = useZtgPrice();

  // Split positions into regular and multi-market
  const { regularMarketPositions, multiMarketPositions } = useMemo(() => {
    if (!positionsByMarket) {
      return { regularMarketPositions: null, multiMarketPositions: null };
    }

    const regular: typeof positionsByMarket = {};
    const multi: typeof positionsByMarket = {};

    Object.entries(positionsByMarket).forEach(([marketId, marketPositions]) => {
      const isMulti = marketPositions.some((p) => p.isMultiMarket);
      if (isMulti) {
        multi[marketId] = marketPositions;
      } else {
        regular[marketId] = marketPositions;
      }
    });

    return { regularMarketPositions: regular, multiMarketPositions: multi };
  }, [positionsByMarket]);

  // Get positions for P&L calculation (only for visible items)
  const visiblePositions = useMemo(() => {
    const marketGroups =
      predictionsTabSelection === "Multi-Markets"
        ? multiMarketPositions
        : regularMarketPositions;

    if (!marketGroups) return [];

    const allMarkets = Object.values(marketGroups);
    const startIdx = currentPage * POSITIONS_PER_PAGE;
    const endIdx =
      Math.max(...Array.from(loadedPages)) * POSITIONS_PER_PAGE +
      POSITIONS_PER_PAGE;

    return allMarkets.slice(startIdx, endIdx).flatMap((positions) => positions);
  }, [
    regularMarketPositions,
    multiMarketPositions,
    predictionsTabSelection,
    currentPage,
    loadedPages,
  ]);

  // Calculate P&L only for visible positions
  const { data: pnlData, isLoading: pnlLoading } = usePositionPnL(
    address,
    visiblePositions.map((p) => ({
      assetId: p.assetId,
      marketId: p.marketId,
      outcome: p.outcome,
      price: p.price,
      userBalance: p.userBalance,
    })),
    true,
  );

  // Merge P&L data with positions
  const positionsWithPnL = useMemo(() => {
    if (!pnlData) return visiblePositions;

    return visiblePositions.map((position) => {
      const pnl = pnlData.find((p) => p.assetId === position.assetId);
      return {
        ...position,
        avgCost: pnl?.avgCost ?? 0,
        upnl: pnl?.upnl ?? 0,
        rpnl: pnl?.rpnl ?? 0,
      };
    });
  }, [visiblePositions, pnlData]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    setLoadedPages((prev) => new Set([...prev, nextPage]));
  }, [currentPage]);

  // Render market positions with pagination
  const renderMarketPositions = (
    marketPositionsByMarket: typeof regularMarketPositions,
    isMultiMarketTab: boolean,
  ) => {
    if (!marketPositionsByMarket || !ztgPrice) {
      return range(0, 4).map((i) => (
        <MarketPositionsSkeleton className="mb-6" key={i} />
      ));
    }

    const allMarkets = Object.values(marketPositionsByMarket);

    if (allMarkets.length === 0) {
      return (
        <EmptyPortfolio
          headerText={`You don't have any ${isMultiMarketTab ? "multi-market" : "market"} positions`}
          bodyText="View markets to trade assets"
          buttonText="View Markets"
          buttonLink="/markets"
        />
      );
    }

    // Calculate pagination
    const totalPages = Math.ceil(allMarkets.length / POSITIONS_PER_PAGE);
    const visibleMarkets = allMarkets.slice(
      0,
      Math.max(...Array.from(loadedPages)) * POSITIONS_PER_PAGE +
        POSITIONS_PER_PAGE,
    );

    return (
      <>
        {visibleMarkets.map((marketPositions) => {
          const market = marketPositions[0].market;
          const positionsWithPnLForMarket = marketPositions.map((pos) => {
            const pnl = pnlData?.find((p) => p.assetId === pos.assetId);
            return {
              ...pos,
              avgCost: pnl?.avgCost ?? 0,
              upnl: pnl?.upnl ?? 0,
              rpnl: pnl?.rpnl ?? 0,
            };
          });

          return (
            <MarketPositions
              key={market.marketId}
              className="mb-6"
              market={market}
              positions={positionsWithPnLForMarket}
              usdZtgPrice={ztgPrice}
            />
          );
        })}

        {/* Load more button or infinite scroll trigger */}
        {currentPage < totalPages - 1 && (
          <LoadMoreTrigger onLoadMore={handleLoadMore} />
        )}
      </>
    );
  };

  return (
    <Tab.Group
      defaultIndex={0}
      selectedIndex={
        predictionsTabSelection &&
        predictionsSubTabs.indexOf(predictionsTabSelection)
      }
      onChange={(index) => {
        setPredictionsTabSelection(predictionsSubTabs[index]);
        // Reset pagination when switching tabs
        setCurrentPage(0);
        setLoadedPages(new Set([0]));
      }}
    >
      <SubTabsList titles={predictionsSubTabs} />
      <Tab.Panels>
        <Tab.Panel>
          {renderMarketPositions(regularMarketPositions, false)}
        </Tab.Panel>
        <Tab.Panel>
          {renderMarketPositions(multiMarketPositions, true)}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};

/**
 * Component to trigger loading more items (infinite scroll)
 */
const LoadMoreTrigger = ({ onLoadMore }: { onLoadMore: () => void }) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Load more when trigger is in view
  if (inView) {
    onLoadMore();
  }

  return (
    <div ref={ref} className="py-4 text-center">
      <button
        onClick={onLoadMore}
        className="rounded-lg bg-sky-100 px-4 py-2 transition-colors hover:bg-sky-200"
      >
        Load More Positions
      </button>
    </div>
  );
};

export default PredictionsTabGroup;
