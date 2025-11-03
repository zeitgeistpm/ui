import { useQuery } from "@tanstack/react-query";
import { useFilteredPositions } from "./usePortfolioCore";
import { usePositionPrices } from "./usePositionPrices";
import { usePositionPnL } from "./usePositionPnL";
import { useMarketsByIds } from "../useMarketsByIds";
import { usePoolsByIds } from "../usePoolsByIds";
import { useAccountAmm2Pool } from "../useAccountAmm2Pools";
import { useCurrencyBalances } from "../useCurrencyBalances";
import { useMemo } from "react";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import Decimal from "decimal.js";
import {
  IOMarketOutcomeAssetId,
  IOCategoricalAssetId,
  IOScalarAssetId,
  getIndexOf,
  getMarketIdOf,
} from "@zeitgeistpm/sdk";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { useCombinatorialTokenMarketIds } from "../useCombinatorialTokenMarketIds";
import { useMultiMarketAssets } from "../useMultiMarketAssets";
import { useAccountAssetBalances } from "../useAccountAssetBalances";
import { groupBy } from "lodash-es";

/**
 * Hook for Predictions tab data - loads market positions
 */
export const usePredictionsTabData = (address?: string, enabled: boolean = true) => {
  // Get market and combinatorial positions
  const { data: positions, isLoading: positionsLoading } = useFilteredPositions(
    address,
    ["market", "combinatorial"],
  );

  // Process combinatorial tokens
  const combinatorialTokens = useMemo(() => {
    return positions
      ?.filter((p) => p.assetType === "combinatorial")
      .map((p) => p.assetId.CombinatorialToken)
      .filter(isNotNull) ?? [];
  }, [positions]);

  // Get market IDs for combinatorial tokens
  const { data: combinatorialMarketIds, isLoading: comboLoading } =
    useCombinatorialTokenMarketIds(combinatorialTokens);

  // Identify multi-market tokens
  const multiMarketTokenIds = useMemo(() => {
    if (!combinatorialMarketIds) return [];
    return Object.entries(combinatorialMarketIds)
      .filter(([key, value]) => value === null)
      .map(([key]) => key);
  }, [combinatorialMarketIds]);

  // Get multi-market assets
  const multiMarketAssets = useMemo(() => {
    return multiMarketTokenIds.map(id => `"combinatorialToken":"${id}"`);
  }, [multiMarketTokenIds]);

  const { data: multiMarketAssetsData } = useMultiMarketAssets(
    multiMarketAssets,
    { enabled: enabled && multiMarketAssets.length > 0 },
  );

  // Get unique market IDs
  const marketIds = useMemo(() => {
    const ids = new Set<number>();
    positions?.forEach((p) => {
      if (p.marketId) ids.add(p.marketId);
    });
    // Add combinatorial market IDs
    if (combinatorialMarketIds) {
      Object.values(combinatorialMarketIds).forEach((id) => {
        if (id !== null) ids.add(id);
      });
    }
    return Array.from(ids);
  }, [positions, combinatorialMarketIds]);

  // Fetch markets
  const { data: markets, isLoading: marketsLoading } = useMarketsByIds(
    marketIds.map((id) => ({ marketId: id })),
    { enabled: enabled && marketIds.length > 0 },
  );

  // Get user balances
  const { data: balances } = useAccountAssetBalances(
    positions?.map((p) => ({ assetId: p.assetId, account: address })) ?? [],
    undefined,
    { enabled: enabled && Boolean(positions?.length && address) },
  );

  // Get prices for positions
  const positionsWithMarketIds = useMemo(() => {
    return positions?.map((p) => {
      let marketId = p.marketId;
      if (p.assetType === "combinatorial" && combinatorialMarketIds) {
        marketId = combinatorialMarketIds[p.assetId.CombinatorialToken] ?? undefined;
      }
      return { ...p, marketId };
    });
  }, [positions, combinatorialMarketIds]);

  const { data: prices, isLoading: pricesLoading } = usePositionPrices(
    positionsWithMarketIds,
    enabled && Boolean(positionsWithMarketIds),
  );

  // Process positions with all data
  const processedPositions = useMemo(() => {
    if (!positions || !markets || !prices || !balances) return null;

    return positions.map((position) => {
      const market = markets.find((m) => m.marketId === position.marketId);
      const priceData = prices.find((p) => p.assetId === position.assetId);
      const balance = balances.get(address!, position.assetId)?.data?.balance ?? new Decimal(0);

      // Determine outcome name and color
      let outcome = "Unknown";
      let color = "#999999";

      if (market) {
        if (IOCategoricalAssetId.is(position.assetId)) {
          const index = getIndexOf(position.assetId);
          outcome = market.categories?.[index]?.name ?? outcome;
          color = market.categories?.[index]?.color ?? color;
        } else if (IOScalarAssetId.is(position.assetId)) {
          outcome = getIndexOf(position.assetId) === 1 ? "Short" : "Long";
          color = getIndexOf(position.assetId) === 1 ? "rgb(255, 0, 0)" : "rgb(36, 255, 0)";
        } else if (isCombinatorialToken(position.assetId)) {
          // Handle combinatorial token outcome
          const tokenHash = position.assetId.CombinatorialToken;
          const index = market.outcomeAssets?.findIndex((asset) =>
            asset.includes(tokenHash),
          );
          if (index !== undefined && index >= 0 && market.categories?.[index]) {
            outcome = market.categories[index].name;
            color = market.categories[index].color || color;
          }
        }
      }

      return {
        ...position,
        market,
        outcome,
        color,
        price: priceData?.price ?? new Decimal(0),
        price24HoursAgo: priceData?.price24HoursAgo ?? new Decimal(0),
        changePercentage: priceData?.changePercentage ?? 0,
        userBalance: balance,
      };
    });
  }, [positions, markets, prices, balances, address]);

  // Group by market
  const positionsByMarket = useMemo(() => {
    if (!processedPositions) return null;
    return groupBy(processedPositions, (p) => p.market?.marketId);
  }, [processedPositions]);

  return {
    positions: processedPositions,
    positionsByMarket,
    isLoading: positionsLoading || marketsLoading || pricesLoading || comboLoading,
  };
};

/**
 * Hook for Created Markets tab data
 */
export const useCreatedMarketsTabData = (address?: string, enabled: boolean = true) => {
  const { data: pools, isLoading } = useAccountAmm2Pool(address, { enabled });

  // Split pools into regular and multi-market
  const { regularMarketPools, multiMarketPools } = useMemo(() => {
    if (!pools) {
      return { regularMarketPools: null, multiMarketPools: null };
    }

    const regular: typeof pools = [];
    const multi: typeof pools = [];

    pools.forEach((pool) => {
      if (pool.isMultiMarket && pool.marketIds && pool.marketIds.length > 1) {
        multi.push(pool);
      } else {
        regular.push(pool);
      }
    });

    return { regularMarketPools: regular, multiMarketPools: multi };
  }, [pools]);

  return {
    regularMarketPools,
    multiMarketPools,
    isLoading,
  };
};

/**
 * Hook for Balances tab data
 */
export const useBalancesTabData = (address?: string, enabled: boolean = true) => {
  const { data: balances, isFetched } = useCurrencyBalances(address, { enabled });

  return {
    balances,
    isLoading: !isFetched,
  };
};

/**
 * Combined hook for tab-specific data loading
 */
export const usePortfolioTabData = (
  tab: "Predictions" | "Balances" | "Created Markets",
  address?: string,
) => {
  switch (tab) {
    case "Predictions":
      return usePredictionsTabData(address, true);
    case "Balances":
      return useBalancesTabData(address, true);
    case "Created Markets":
      return useCreatedMarketsTabData(address, true);
    default:
      return { isLoading: false, data: null };
  }
};