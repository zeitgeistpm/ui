import { useQuery } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { AssetId } from "@zeitgeistpm/sdk";
import { useAmm2Pool } from "./amm2/useAmm2Pool";
import { useMarket } from "./useMarket";

import { useSdkv2 } from "../useSdkv2";
import { calcMarketColors } from "lib/util/color-calc";
import { ChartSeries } from "components/ui/TimeSeriesChart";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useMemo } from "react";

import Decimal from "decimal.js";

export interface OutcomeCombination {
  assetId: { CombinatorialToken: `0x${string}` };
  name: string;
  market1Outcome: string;
  market2Outcome: string;
  color: string;
}

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

export const comboMarketKey = "combo-market";

export const useComboMarket = (poolId: number) => {
  const [sdk, id] = useSdkv2();
  const { data: pool } = useAmm2Pool(0, poolId); // marketId=0 for combo pools, poolId is the actual pool

  // Extract market IDs from the combinatorial pool
  const marketIds = useMemo(() => {
    if (!pool?.poolType?.combinatorial) {
      return null; // Don't use fallback - wait for real data
    }
      
    const extractedMarketIds = pool.poolType.combinatorial;
    
    return [extractedMarketIds[0], extractedMarketIds[1]] as [number, number];
  }, [pool?.poolType]);

  const { data: market1 } = useMarket(marketIds ? { marketId: marketIds[0] } : undefined);
  const { data: market2 } = useMarket(marketIds ? { marketId: marketIds[1] } : undefined);

  const query = useQuery(
    [id, comboMarketKey, poolId, market1?.marketId, market2?.marketId],
    (): ComboMarketData | null => {
      if (!pool || !market1 || !market2 || !marketIds) {
        return null;
      }

      // Filter assetIds to only include CombinatorialTokens
      const combinatorialAssets = pool.assetIds.filter(
        (asset): asset is { CombinatorialToken: `0x${string}` } => 
          typeof asset === 'object' && asset !== null && 'CombinatorialToken' in asset
      );

      // Generate outcome combinations with actual asset IDs
      const combinations: OutcomeCombination[] = [];
      const colors = calcMarketColors(1, 4); // Generate colors for combinations

      let colorIndex = 0;
      let assetIndex = 0;
      market1.categories?.forEach((cat1, i) => {
        market2.categories?.forEach((cat2, j) => {
          const assetId = combinatorialAssets[assetIndex];
          
          combinations.push({
            assetId: assetId || { CombinatorialToken: `0x${"0".repeat(64)}` as `0x${string}` }, // Provide fallback
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

      // Convert baseAsset object to AssetId - for combo markets, typically ZTG
      const baseAssetId = parseAssetIdString('ZTG');

      return {
        poolId,
        accountId: pool.accountId,
        question: `${market1.question} & ${market2.question}`,
        description: `Combinatorial market combining: "${market1.question}" and "${market2.question}". Trade on the probability of both outcomes occurring together.`,
        sourceMarkets: [market1, market2],
        outcomeCombinations: combinations,
        baseAsset: baseAssetId!,
        chartSeries,
        liquidity: new Decimal(pool.liquidity).toNumber(),
        reserves: pool.reserves,
        marketIds: [market1.marketId, market2.marketId],
      };
    },
    {
      enabled: Boolean(pool && market1 && market2 && marketIds),
    }
  );

  return query;
};;; 