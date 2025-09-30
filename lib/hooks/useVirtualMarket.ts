import { useMemo } from "react";
import { FullMarketFragment, MarketStatus } from "@zeitgeistpm/indexer";
import { AssetId } from "@zeitgeistpm/sdk";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useAmm2Pool } from "./queries/amm2/useAmm2Pool";
import { useMarket } from "./queries/useMarket";
import { calcMarketColors } from "lib/util/color-calc";
import { ChartSeries } from "components/ui/TimeSeriesChart";
import Decimal from "decimal.js";

export interface OutcomeCombination {
  assetId: { CombinatorialToken: `0x${string}` };
  name: string;
  market1Outcome: string;
  market2Outcome: string;
  color: string;
}

const getCombinedMarketPeriod = (
  sourceMarkets: [FullMarketFragment, FullMarketFragment],
): { block: string[]; start: string; end: string } => {
  let earliestStart: string | null = null;
  let earliestEnd: string | null = null;

  sourceMarkets.forEach((market) => {
    if (market.period) {
      const marketStart = market.period.start;
      const marketEnd = market.period.end;

      if (marketStart && marketEnd) {
        if (!earliestStart || parseInt(marketStart) < parseInt(earliestStart)) {
          earliestStart = marketStart;
        }

        if (!earliestEnd || parseInt(marketEnd) < parseInt(earliestEnd)) {
          earliestEnd = marketEnd;
        }
      }
    }
  });

  const start = earliestStart || "0";
  const end = earliestEnd || "1000000000000";

  return {
    block: [start, end],
    start,
    end,
  };
};

const getCombinedMarketStatus = (
  sourceMarkets: [FullMarketFragment, FullMarketFragment],
): MarketStatus => {
  const hasInactiveMarket = sourceMarkets.some(
    market => market.status !== MarketStatus.Active
  );
  return hasInactiveMarket ? MarketStatus.Closed : MarketStatus.Active;
};

const getCombinedMarketDeadlines = (
  sourceMarkets: [FullMarketFragment, FullMarketFragment],
) => {
  const marketWithEarliestEnd = sourceMarkets.reduce((earliest, current) =>
    Number(current.period?.end || 0) < Number(earliest.period?.end || 0)
      ? current
      : earliest
  );

  return {
    gracePeriod: marketWithEarliestEnd.deadlines?.gracePeriod,
    oracleDuration: marketWithEarliestEnd.deadlines?.oracleDuration,
    disputeDuration: marketWithEarliestEnd.deadlines?.disputeDuration,
  };
};

export const useVirtualMarket = (
  poolId: number,
  marketIds?: [number, number]
): FullMarketFragment | null => {
  // Fetch pool data for the combo market
  const { data: poolData } = useAmm2Pool(0, poolId); // marketId=0 for combo pools

  // Fetch market data for each source market
  const { data: market1 } = useMarket(marketIds ? { marketId: marketIds[0] } : undefined);
  const { data: market2 } = useMarket(marketIds ? { marketId: marketIds[1] } : undefined);

  return useMemo(() => {
    if (!poolData || !market1 || !market2 || !marketIds) return null;

    // Filter assetIds to only include CombinatorialTokens
    const combinatorialAssets = poolData.assetIds?.filter(
      (asset): asset is { CombinatorialToken: `0x${string}` } =>
        typeof asset === 'object' && asset !== null && 'CombinatorialToken' in asset
    ) || [];

    // Generate outcome combinations with actual asset IDs
    const combinations: OutcomeCombination[] = [];
    const colors = calcMarketColors(1, 4); // Generate colors for combinations

    let colorIndex = 0;
    let assetIndex = 0;
    market1.categories?.forEach((cat1, i) => {
      market2.categories?.forEach((cat2, j) => {
        const assetId = combinatorialAssets[assetIndex];

        combinations.push({
          assetId: assetId || { CombinatorialToken: `0x${"0".repeat(64)}` as `0x${string}` },
          name: `${cat1.name} & ${cat2.name}`,
          market1Outcome: cat1.name || `Outcome ${i}`,
          market2Outcome: cat2.name || `Outcome ${j}`,
          color: colors[colorIndex % colors.length],
        });
        colorIndex++;
        assetIndex++;
      });
    });

    // Create chart series for combinations
    const chartSeries: ChartSeries[] = combinations.map((combination, index) => ({
      accessor: `v${index}`,
      label: combination.name,
      color: combination.color,
    }));

    const question = `${market1.question} & ${market2.question}`;
    const description = `Combinatorial market combining: "${market1.question}" and "${market2.question}". Trade on the probability of both outcomes occurring together.`;
    const sourceMarkets: [FullMarketFragment, FullMarketFragment] = [market1, market2];
    const baseAssetId = parseAssetIdString('ZTG');

    const virtualMarket: FullMarketFragment = {
      marketId: poolId,
      marketIds: marketIds,
      question,
      description,
      status: getCombinedMarketStatus(sourceMarkets),
      oracle: poolData.accountId,
      categories: combinations.map((combo) => ({
        name: combo.name,
        color: combo.color,
      })),
      baseAsset: baseAssetId || ("ZTG" as any),
      outcomeAssets:
        poolData.assetIds?.map((asset, index) => {
          if (typeof asset === "object" && "CombinatorialToken" in asset) {
            return asset.CombinatorialToken;
          }
          return `${poolId}-${index}`;
        }) ||
        combinations.map((_, index) => `${poolId}-${index}`),
      pool: null,
      neoPool: poolData
        ? {
            ...poolData,
            totalStake: poolData.liquidity?.toString(),
            totalShares: poolData.totalShares?.toString(),
            liquidityParameter: poolData.liquidity?.toString(),
            reserves: poolData.reserves
              ? Object.fromEntries(poolData.reserves)
              : {},
            _debug: {
              assetIds: poolData.assetIds,
              reservesType: typeof poolData.reserves,
              reservesSize: poolData.reserves?.size || 0,
            },
          }
        : null,
      slug: `combo-${poolId}`,
      __typename: "Market" as const,
      creation: "Proposed" as const,
      creator: poolData.accountId,
      earlyClose: null,
      disputeMechanism: "Authorized" as const,
      hasValidMetaCategories: true,
      img: null,
      marketType: { categorical: null, scalar: null },
      period: getCombinedMarketPeriod(sourceMarkets),
      deadlines: getCombinedMarketDeadlines(sourceMarkets),
      resolvedOutcome: null,
      scalarType: null,
      tags: [],
      volume: "0",
      liquidity: poolData.liquidity,
      report: null,
      disputes: [],
      rejectReason: null,
    } as unknown as FullMarketFragment;

    return virtualMarket;
  }, [poolId, marketIds, poolData, market1, market2]);
};

// Export helper data interface for components that need combo market data
export interface ComboMarketData {
  poolId: number;
  accountId: string;
  question: string;
  description: string;
  sourceMarkets: [FullMarketFragment, FullMarketFragment];
  outcomeCombinations: OutcomeCombination[];
  baseAsset: AssetId;
  chartSeries: ChartSeries[];
  marketIds: [number, number];
  liquidity: number;
  reserves: any;
}

// Helper function to get combo market data from virtual market and pool data
export const getComboMarketData = (
  virtualMarket: FullMarketFragment | null,
  poolData: any,
  marketIds?: [number, number]
): ComboMarketData | null => {
  if (!virtualMarket || !poolData || !marketIds) return null;

  const sourceMarkets = virtualMarket.categories && virtualMarket.question ?
    [virtualMarket, virtualMarket] as [FullMarketFragment, FullMarketFragment] :
    null;

  if (!sourceMarkets) return null;

  const combinations: OutcomeCombination[] = virtualMarket.categories?.map((cat, index) => ({
    assetId: { CombinatorialToken: `0x${"0".repeat(64)}` as `0x${string}` },
    name: cat.name || '',
    market1Outcome: '',
    market2Outcome: '',
    color: cat.color || '',
  })) || [];

  const chartSeries: ChartSeries[] = combinations.map((combination, index) => ({
    accessor: `v${index}`,
    label: combination.name,
    color: combination.color,
  }));

  return {
    poolId: virtualMarket.marketId,
    accountId: virtualMarket.oracle || '',
    question: virtualMarket.question || '',
    description: virtualMarket.description || '',
    sourceMarkets,
    outcomeCombinations: combinations,
    baseAsset: (virtualMarket.baseAsset as unknown) as AssetId,
    chartSeries,
    marketIds,
    liquidity: new Decimal(poolData.liquidity || 0).toNumber(),
    reserves: poolData.reserves,
  };
};