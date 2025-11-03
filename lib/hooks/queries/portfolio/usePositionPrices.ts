import { useQuery } from "@tanstack/react-query";
import { ScoringRule } from "@zeitgeistpm/indexer";
import Decimal from "decimal.js";
import { calcResolvedMarketPrices } from "lib/util/calc-resolved-market-prices";
import { useMarketsByIds } from "../useMarketsByIds";
import { useAmm2MarketSpotPrices, lookupAssetPrice } from "../useAmm2MarketSpotPrices";
import {
  IOMarketOutcomeAssetId,
  getIndexOf,
  AssetId,
} from "@zeitgeistpm/sdk";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { useMemo } from "react";
import { useChainTime } from "lib/state/chaintime";

export type PriceData = {
  assetId: AssetId;
  price: Decimal;
  price24HoursAgo?: Decimal;
  changePercentage: number;
};

/**
 * Fetches prices for specific assets on demand.
 * Only queries when enabled and positions are provided.
 */
export const usePositionPrices = (
  positions: Array<{ assetId: any; marketId?: number }> | undefined,
  enabled: boolean = true,
) => {
  const now = useChainTime();
  const block24HoursAgo = now?.block ? Math.floor(now.block - 7200) : undefined;

  // Extract unique market IDs
  const marketIds = useMemo(() => {
    if (!positions) return [];
    const uniqueIds = new Set<number>();
    positions.forEach((p) => {
      if (p.marketId !== undefined) {
        uniqueIds.add(p.marketId);
      }
    });
    return Array.from(uniqueIds);
  }, [positions]);

  // Fetch markets for the positions
  const marketsQuery = useMarketsByIds(
    marketIds.map((id) => ({ marketId: id })),
    { enabled: enabled && marketIds.length > 0 },
  );

  // Filter for AMM2 markets
  const amm2MarketIds = useMemo(() => {
    return marketsQuery.data
      ?.filter(
        (market) =>
          market.scoringRule === ScoringRule.AmmCdaHybrid ||
          market.scoringRule === ScoringRule.Lmsr,
      )
      .map((m) => m.marketId);
  }, [marketsQuery.data]);

  // Fetch current prices
  const { data: currentPrices } = useAmm2MarketSpotPrices(
    amm2MarketIds,
    undefined,
    { enabled: enabled && Boolean(amm2MarketIds?.length) },
  );

  // Fetch 24h ago prices
  const { data: prices24HoursAgo } = useAmm2MarketSpotPrices(
    amm2MarketIds,
    block24HoursAgo,
    { enabled: enabled && Boolean(amm2MarketIds?.length && block24HoursAgo) },
  );

  // Calculate prices for all positions
  const priceData = useMemo<PriceData[] | undefined>(() => {
    if (!positions || !marketsQuery.data) return undefined;

    return positions.map((position) => {
      const market = marketsQuery.data?.find((m) => m.marketId === position.marketId);

      let price = new Decimal(0);
      let price24HoursAgo = new Decimal(0);

      if (market) {
        if (IOMarketOutcomeAssetId.is(position.assetId)) {
          if (market.status === "Resolved") {
            price = calcResolvedMarketPrices(market).get(getIndexOf(position.assetId)) ?? new Decimal(0);
            price24HoursAgo = price;
          } else if (
            market.scoringRule === ScoringRule.AmmCdaHybrid ||
            market.scoringRule === ScoringRule.Lmsr
          ) {
            price = lookupAssetPrice(position.assetId, currentPrices) ?? new Decimal(0);
            price24HoursAgo = lookupAssetPrice(position.assetId, prices24HoursAgo) ?? new Decimal(0);
          }
        } else if (isCombinatorialToken(position.assetId)) {
          if (market.status === "Resolved") {
            // TODO: Handle resolved combinatorial token prices
            price = new Decimal(0);
            price24HoursAgo = price;
          } else if (
            market.scoringRule === ScoringRule.AmmCdaHybrid ||
            market.scoringRule === ScoringRule.Lmsr
          ) {
            price = lookupAssetPrice(position.assetId, currentPrices) ?? new Decimal(0);
            price24HoursAgo = lookupAssetPrice(position.assetId, prices24HoursAgo) ?? new Decimal(0);
          }
        }
      }

      const changePercentage = calculateChangePercentage(price, price24HoursAgo);

      return {
        assetId: position.assetId,
        price,
        price24HoursAgo,
        changePercentage,
      };
    });
  }, [positions, marketsQuery.data, currentPrices, prices24HoursAgo]);

  return {
    data: priceData,
    isLoading: marketsQuery.isLoading,
    error: marketsQuery.error,
  };
};

/**
 * Calculate percentage change between two prices
 */
const calculateChangePercentage = (current: Decimal, previous: Decimal): number => {
  if (previous.isZero()) return 0;
  const diff = current.minus(previous);
  const change = diff.div(previous).mul(100);
  return change.toNumber();
};