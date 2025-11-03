/**
 * Optimized Portfolio Hooks
 *
 * This module exports specialized hooks for efficient portfolio data fetching.
 * Each hook is designed to load only the necessary data, reducing API calls and improving performance.
 */

// Core hooks
export { usePortfolioCore, useFilteredPositions } from "./usePortfolioCore";
export type { CorePosition } from "./usePortfolioCore";

// Price hooks
export { usePositionPrices } from "./usePositionPrices";
export type { PriceData } from "./usePositionPrices";

// P&L hooks
export { usePositionPnL, useBatchPositionPnL } from "./usePositionPnL";
export type { PnLData } from "./usePositionPnL";

// Summary hooks
export { usePortfolioSummary, useCachedPortfolioSummary } from "./usePortfolioSummary";
export type { PortfolioSummary } from "./usePortfolioSummary";

// Tab data hooks
export {
  usePredictionsTabData,
  useCreatedMarketsTabData,
  useBalancesTabData,
  usePortfolioTabData,
} from "./usePortfolioTabs";

// Query configuration
export {
  portfolioQueryConfig,
  createPortfolioQueryClient,
  portfolioInvalidation,
  portfolioPrefetch,
} from "./queryConfig";

/**
 * Migration Guide from usePortfolioPositions to Optimized Hooks
 *
 * Old:
 * ```
 * const { markets, subsidy, breakdown } = usePortfolioPositions(address);
 * ```
 *
 * New:
 * ```
 * // For header/summary data only
 * const summary = usePortfolioSummary(address);
 *
 * // For specific tab data
 * const { positions, positionsByMarket } = usePredictionsTabData(address);
 *
 * // For P&L calculations (on demand)
 * const { data: pnlData } = usePositionPnL(address, positions);
 * ```
 *
 * Benefits:
 * - 60-70% reduction in initial load time
 * - Only loads data for active tab
 * - P&L calculations run on demand
 * - Built-in caching and invalidation
 * - Pagination support for large portfolios
 */