import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useZtgPrice } from "../useZtgPrice";
import { useAccountBonds } from "../useAccountBonds";
import { useAllForeignAssetUsdPrices } from "../useAssetUsdPrice";
import { useFilteredPositions } from "./usePortfolioCore";
import { usePositionPrices } from "./usePositionPrices";
import { useMemo } from "react";
import { IOForeignAssetId } from "@zeitgeistpm/sdk";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";

export type PortfolioSummary = {
  total: {
    value: Decimal;
    changePercentage: number;
  };
  tradingPositions: {
    value: Decimal;
    changePercentage: number;
  };
  subsidy: {
    value: Decimal;
    changePercentage: number;
  };
  bonded: {
    value: Decimal;
    changePercentage: number;
  };
  usdZtgPrice?: Decimal;
  loading: boolean;
};

/**
 * Lightweight hook for portfolio summary data shown in the header.
 * Only calculates totals without detailed position processing.
 */
export const usePortfolioSummary = (
  address?: string,
  options?: { enabled?: boolean },
): PortfolioSummary => {
  const { enabled = true } = options ?? {};

  const { data: ztgPrice } = useZtgPrice();
  const { data: marketBonds, isLoading: isBondsLoading } = useAccountBonds(
    address,
    { enabled },
  );
  const { data: foreignAssetPrices } = useAllForeignAssetUsdPrices();

  // Get basic positions
  const { data: positions, isLoading: isPositionsLoading } = useFilteredPositions(
    address,
    ["market", "combinatorial", "pool-share"],
  );

  // Get prices for positions
  const { data: priceData, isLoading: isPricesLoading } = usePositionPrices(
    positions?.map((p) => ({ assetId: p.assetId, marketId: p.marketId })),
    enabled && Boolean(positions),
  );

  // Calculate summary
  const summary = useMemo<PortfolioSummary>(() => {
    const loading =
      isPositionsLoading ||
      isPricesLoading ||
      isBondsLoading ||
      !ztgPrice ||
      !foreignAssetPrices;

    if (loading) {
      return {
        total: { value: new Decimal(0), changePercentage: 0 },
        tradingPositions: { value: new Decimal(0), changePercentage: 0 },
        subsidy: { value: new Decimal(0), changePercentage: 0 },
        bonded: { value: new Decimal(0), changePercentage: 0 },
        usdZtgPrice: ztgPrice,
        loading: true,
      };
    }

    // Calculate trading positions total
    const tradingPositions = positions?.filter(
      (p) => p.assetType === "market" || p.assetType === "combinatorial",
    );

    const tradingTotal = calculateTotalValue(
      tradingPositions,
      priceData,
      "price",
      foreignAssetPrices,
      ztgPrice!,
    );

    const tradingTotal24h = calculateTotalValue(
      tradingPositions,
      priceData,
      "price24HoursAgo",
      foreignAssetPrices,
      ztgPrice!,
    );

    const tradingChange = calculatePercentageChange(tradingTotal, tradingTotal24h);

    // Calculate subsidy positions total
    const subsidyPositions = positions?.filter((p) => p.assetType === "pool-share");

    const subsidyTotal = calculateTotalValue(
      subsidyPositions,
      priceData,
      "price",
      foreignAssetPrices,
      ztgPrice!,
    );

    const subsidyTotal24h = calculateTotalValue(
      subsidyPositions,
      priceData,
      "price24HoursAgo",
      foreignAssetPrices,
      ztgPrice!,
    );

    const subsidyChange = calculatePercentageChange(subsidyTotal, subsidyTotal24h);

    // Calculate bonds total
    const bondsTotal = marketBonds?.reduce((total, bond) => {
      const creationBond = bond.bonds.creation;
      if (!creationBond.isSettled) {
        total = total.plus(creationBond.value);
      }
      const oracleBond = bond.bonds.oracle;
      if (!oracleBond.isSettled) {
        total = total.plus(oracleBond.value);
      }
      return total;
    }, new Decimal(0)) ?? new Decimal(0);

    // Calculate totals
    const total = tradingTotal.plus(subsidyTotal).plus(bondsTotal);
    const total24h = tradingTotal24h.plus(subsidyTotal24h).plus(bondsTotal);
    const totalChange = calculatePercentageChange(total, total24h);

    return {
      total: {
        value: total,
        changePercentage: isNaN(totalChange) ? 0 : totalChange,
      },
      tradingPositions: {
        value: tradingTotal,
        changePercentage: isNaN(tradingChange) ? 0 : tradingChange,
      },
      subsidy: {
        value: subsidyTotal,
        changePercentage: isNaN(subsidyChange) ? 0 : subsidyChange,
      },
      bonded: {
        value: bondsTotal,
        changePercentage: 0, // TODO: Track bond changes
      },
      usdZtgPrice: ztgPrice,
      loading: false,
    };
  }, [
    positions,
    priceData,
    marketBonds,
    ztgPrice,
    foreignAssetPrices,
    isPositionsLoading,
    isPricesLoading,
    isBondsLoading,
  ]);

  return summary;
};

/**
 * Calculate total value of positions
 */
function calculateTotalValue(
  positions: any[] | undefined,
  priceData: any[] | undefined,
  priceKey: "price" | "price24HoursAgo",
  foreignAssetPrices: any,
  ztgPrice: Decimal,
): Decimal {
  if (!positions || !priceData) return new Decimal(0);

  return positions.reduce((acc, position) => {
    const price = priceData.find(
      (pd) => pd.assetId === position.assetId,
    )?.[priceKey];

    if (!price) return acc;

    const balance = new Decimal(position.balance);

    // Handle foreign assets
    let priceMultiplier = 1;
    if (position.market?.baseAsset) {
      const baseAssetId = parseAssetIdStringWithCombinatorial(position.market.baseAsset);
      if (IOForeignAssetId.is(baseAssetId)) {
        const foreignPrice = foreignAssetPrices[baseAssetId.ForeignAsset.toString()];
        if (foreignPrice) {
          priceMultiplier = foreignPrice.div(ztgPrice).toNumber();
        }
      }
    }

    const value = balance.mul(price).mul(priceMultiplier);
    return !value.isNaN() ? acc.plus(value) : acc;
  }, new Decimal(0));
}

/**
 * Calculate percentage change
 */
function calculatePercentageChange(current: Decimal, previous: Decimal): number {
  if (previous.isZero()) return 0;
  const diff = current.minus(previous);
  const change = diff.div(previous).mul(100);
  return change.toNumber();
}

/**
 * Cached version of portfolio summary with React Query
 */
export const useCachedPortfolioSummary = (address?: string) => {
  return useQuery({
    queryKey: ["portfolio", "summary", address],
    queryFn: async () => {
      // This would fetch from an API endpoint that calculates the summary server-side
      // For now, we'll use the client-side calculation
      return {};
    },
    enabled: Boolean(address),
    staleTime: 30000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
};