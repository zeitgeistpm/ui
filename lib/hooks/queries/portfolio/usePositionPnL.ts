import { useQuery } from "@tanstack/react-query";
import { TradeHistoryItem, useTradeHistory } from "../useTradeHistory";
import { ZTG } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useMemo } from "react";

export type PnLData = {
  assetId: any;
  avgCost: number;
  upnl: number; // Unrealized P&L
  rpnl: number; // Realized P&L
};

/**
 * Calculates P&L for positions on demand.
 * This hook separates the expensive P&L calculations from the main portfolio hook.
 */
export const usePositionPnL = (
  address?: string,
  positions?: Array<{
    assetId: any;
    marketId?: number;
    outcome: string;
    price: Decimal;
    userBalance: Decimal;
  }>,
  enabled: boolean = true,
) => {
  // Fetch trade history only when needed
  const { data: tradeHistory, isLoading: isTradeHistoryLoading } = useTradeHistory(
    address,
    { enabled: enabled && Boolean(address) },
  );

  // Calculate P&L data
  const pnlData = useMemo<PnLData[] | undefined>(() => {
    if (!positions || !tradeHistory) return undefined;

    return positions.map((position) => {
      const marketIds = position.marketId ? [position.marketId] : [];

      // Calculate average cost
      const avgCost = calculateAverageCost(
        tradeHistory,
        marketIds,
        position.outcome,
      );

      // Calculate unrealized P&L
      const upnl = calculateUnrealizedPnL(
        tradeHistory,
        marketIds,
        position.outcome,
        avgCost,
        position.price.toNumber(),
      );

      // Calculate realized P&L using FIFO
      const rpnl = calculateFifoPnl(tradeHistory, marketIds, position.outcome);

      return {
        assetId: position.assetId,
        avgCost,
        upnl,
        rpnl,
      };
    });
  }, [positions, tradeHistory]);

  return {
    data: pnlData,
    isLoading: isTradeHistoryLoading,
    error: null,
  };
};

/**
 * Calculate average cost of acquisition
 */
function calculateAverageCost(
  transactions: TradeHistoryItem[],
  marketIds: number[],
  outcome: string,
): number {
  if (!transactions || marketIds.length === 0) return 0;

  let totalCost = 0;
  let totalAssets = 0;

  transactions
    .filter((tx) => tx && marketIds.includes(tx.marketId) && tx.assetOut === outcome)
    .forEach((tx) => {
      const assetIn = tx.assetAmountOut.div(ZTG).toNumber();
      const price = tx.price.toNumber();

      if (tx.assetIn === tx.baseAssetName) {
        totalCost += assetIn * price;
        totalAssets += assetIn;
      }
    });

  return totalAssets > 0 ? totalCost / totalAssets : 0;
}

/**
 * Calculate unrealized P&L
 */
function calculateUnrealizedPnL(
  transactions: TradeHistoryItem[],
  marketIds: number[],
  outcome: string,
  avgCost: number,
  currentPrice: number,
): number {
  if (!transactions || marketIds.length === 0) return 0;

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx &&
      marketIds.includes(tx.marketId) &&
      (tx.assetIn === outcome || tx.assetOut === outcome),
  );

  const totalQuantity = filteredTransactions.reduce((acc, tx) => {
    if (tx.assetIn === tx.baseAssetName) {
      return acc + tx.assetAmountOut.div(ZTG).toNumber();
    } else if (tx.assetIn === outcome) {
      return acc - tx.assetAmountIn.div(ZTG).toNumber();
    }
    return acc;
  }, 0);

  return (currentPrice - avgCost) * totalQuantity;
}

/**
 * Calculate realized P&L using FIFO method
 */
function calculateFifoPnl(
  transactions: TradeHistoryItem[],
  marketIds: number[],
  outcome: string,
): number {
  if (!transactions || marketIds.length === 0) return 0;

  let buys: Array<{ quantity: number; price: number }> = [];
  let pnl = 0;

  const relevantTxs = transactions
    .filter(
      (tx) =>
        tx &&
        marketIds.includes(tx.marketId) &&
        (tx.assetIn === outcome || tx.assetOut === outcome),
    )
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  relevantTxs.forEach((tx) => {
    const quantity = tx.assetAmountIn.div(ZTG).toNumber();
    const transactionPrice = tx.price.toNumber();

    if (tx.assetIn === tx.baseAssetName) {
      // Buy transaction
      buys.push({ quantity, price: transactionPrice });
    } else {
      // Sell transaction
      let remainingToSell = tx.assetAmountOut.div(ZTG).toNumber();

      while (remainingToSell > 0 && buys.length > 0) {
        const currentBuy = buys[0];
        const sellQuantity = Math.min(currentBuy.quantity, remainingToSell);

        pnl += sellQuantity * (transactionPrice - currentBuy.price);

        remainingToSell -= sellQuantity;
        currentBuy.quantity -= sellQuantity;

        if (currentBuy.quantity === 0) {
          buys = buys.slice(1);
        }
      }
    }
  });

  return pnl;
}

/**
 * Hook for batch P&L calculation with caching
 */
export const useBatchPositionPnL = (
  address?: string,
  positions?: Array<{
    assetId: any;
    marketId?: number;
    outcome: string;
    price: Decimal;
    userBalance: Decimal;
  }>,
  options?: {
    enabled?: boolean;
    batchSize?: number;
  },
) => {
  const { enabled = true, batchSize = 10 } = options ?? {};

  return useQuery({
    queryKey: ["portfolio", "pnl", address, positions?.map((p) => p.assetId).join(",")],
    queryFn: async () => {
      if (!positions || !address) return [];

      // Process in batches to avoid blocking the UI
      const results: PnLData[] = [];
      for (let i = 0; i < positions.length; i += batchSize) {
        const batch = positions.slice(i, i + batchSize);

        // Allow UI to update between batches
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Calculate P&L for this batch
        const { data: tradeHistory } = await fetchTradeHistory(address);

        const batchResults = batch.map((position) => {
          const marketIds = position.marketId ? [position.marketId] : [];
          const avgCost = calculateAverageCost(tradeHistory, marketIds, position.outcome);
          const upnl = calculateUnrealizedPnL(
            tradeHistory,
            marketIds,
            position.outcome,
            avgCost,
            position.price.toNumber(),
          );
          const rpnl = calculateFifoPnl(tradeHistory, marketIds, position.outcome);

          return {
            assetId: position.assetId,
            avgCost,
            upnl,
            rpnl,
          };
        });

        results.push(...batchResults);
      }

      return results;
    },
    enabled: enabled && Boolean(positions?.length && address),
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
};

// Helper to fetch trade history (would be replaced with actual implementation)
async function fetchTradeHistory(address: string): Promise<{ data: TradeHistoryItem[] }> {
  // This would be replaced with actual API call
  return { data: [] };
}