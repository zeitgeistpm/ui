import { QueryClient } from "@tanstack/react-query";

/**
 * Optimized query cache configuration for portfolio data
 * Different data types have different cache strategies based on update frequency
 */
export const portfolioQueryConfig = {
  // Core positions - refresh every 30 seconds
  positions: {
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },

  // Market prices - refresh every 10 seconds
  prices: {
    staleTime: 10 * 1000, // Data is fresh for 10 seconds
    gcTime: 60 * 1000, // Keep in cache for 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
  },

  // Static market data - cache indefinitely
  staticMarketData: {
    staleTime: Infinity, // Never stale
    gcTime: Infinity, // Never garbage collect
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },

  // Account balances - refresh every 15 seconds
  balances: {
    staleTime: 15 * 1000, // Data is fresh for 15 seconds
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchOnWindowFocus: true,
  },

  // P&L calculations - cache for 30 seconds
  pnl: {
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus
  },

  // Portfolio summary - refresh every 20 seconds
  summary: {
    staleTime: 20 * 1000, // Data is fresh for 20 seconds
    gcTime: 3 * 60 * 1000, // Keep in cache for 3 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 20 * 1000, // Auto-refresh every 20 seconds
  },

  // Trade history - cache for 1 minute
  tradeHistory: {
    staleTime: 60 * 1000, // Data is fresh for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  },

  // Pool data - refresh every 30 seconds
  pools: {
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
  },

  // Multi-market data - cache for 45 seconds
  multiMarket: {
    staleTime: 45 * 1000, // Data is fresh for 45 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
  },
};

/**
 * Create a pre-configured QueryClient for portfolio pages
 */
export const createPortfolioQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Global defaults
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });
};

/**
 * Invalidation strategies for portfolio data
 */
export const portfolioInvalidation = {
  // Invalidate all portfolio data for an address
  invalidateAll: (queryClient: QueryClient, address: string) => {
    queryClient.invalidateQueries({ queryKey: ["portfolio", address] });
  },

  // Invalidate only position data
  invalidatePositions: (queryClient: QueryClient, address: string) => {
    queryClient.invalidateQueries({ queryKey: ["portfolio", "positions", address] });
  },

  // Invalidate price data
  invalidatePrices: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["portfolio", "prices"] });
  },

  // Invalidate P&L calculations
  invalidatePnL: (queryClient: QueryClient, address: string) => {
    queryClient.invalidateQueries({ queryKey: ["portfolio", "pnl", address] });
  },

  // Invalidate summary
  invalidateSummary: (queryClient: QueryClient, address: string) => {
    queryClient.invalidateQueries({ queryKey: ["portfolio", "summary", address] });
  },
};

/**
 * Prefetch strategies for portfolio data
 */
export const portfolioPrefetch = {
  // Prefetch next page of positions
  prefetchNextPage: async (
    queryClient: QueryClient,
    address: string,
    page: number,
  ) => {
    await queryClient.prefetchQuery({
      queryKey: ["portfolio", "positions", address, page + 1],
      queryFn: () => fetchPositionsPage(address, page + 1),
      staleTime: portfolioQueryConfig.positions.staleTime,
    });
  },

  // Prefetch summary data
  prefetchSummary: async (queryClient: QueryClient, address: string) => {
    await queryClient.prefetchQuery({
      queryKey: ["portfolio", "summary", address],
      queryFn: () => fetchPortfolioSummary(address),
      staleTime: portfolioQueryConfig.summary.staleTime,
    });
  },

  // Prefetch tab data
  prefetchTab: async (
    queryClient: QueryClient,
    tab: string,
    address: string,
  ) => {
    await queryClient.prefetchQuery({
      queryKey: ["portfolio", "tab", tab, address],
      queryFn: () => fetchTabData(tab, address),
      staleTime: portfolioQueryConfig.positions.staleTime,
    });
  },
};

// Placeholder functions - replace with actual API calls
async function fetchPositionsPage(address: string, page: number) {
  // Implementation would fetch paginated positions
  return [];
}

async function fetchPortfolioSummary(address: string) {
  // Implementation would fetch summary data
  return {};
}

async function fetchTabData(tab: string, address: string) {
  // Implementation would fetch tab-specific data
  return {};
}