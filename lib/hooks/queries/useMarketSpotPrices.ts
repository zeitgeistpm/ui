import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { useQuery } from "@tanstack/react-query";
import { FullMarketFragment, ScoringRule } from "@zeitgeistpm/indexer";
import { 
  isRpcSdk,
  IOCategoricalAssetId,
  IOScalarAssetId,
  IOMarketOutcomeAssetId
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calcSpotPrice } from "lib/math";
import { calculateSpotPrice } from "lib/util/amm2";
import { calcResolvedMarketPrices } from "lib/util/calc-resolved-market-prices";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useSdkv2 } from "../useSdkv2";
import { Amm2Pool, useAmm2Pool } from "./amm2/useAmm2Pool";
import { useAccountPoolAssetBalances } from "./useAccountPoolAssetBalances";
import { useMarket } from "./useMarket";
import { usePoolBaseBalance } from "./usePoolBaseBalance";

export const marketSpotPricesKey = "market-spot-prices";

export type MarketPrices = Map<number, Decimal>;

export const useMarketSpotPrices = (
  marketId?: number,
  blockNumber?: number,
) => {
  const [sdk, id] = useSdkv2();

  const { data: market } = useMarket(
    marketId != null ? { marketId } : undefined,
  );
  const pool = market?.pool ?? undefined;
  const { data: balances } = useAccountPoolAssetBalances(
    pool?.account.accountId,
    pool,
    blockNumber,
  );
  const { data: basePoolBalance } = usePoolBaseBalance(
    pool?.poolId,
    blockNumber,
  );

  const { data: amm2Pool } = useAmm2Pool(marketId, market?.neoPool?.poolId);

  const enabled = isRpcSdk(sdk) && marketId != null && !!market;
  const query = useQuery(
    [
      id,
      marketSpotPricesKey,
      pool,
      blockNumber,
      balances,
      basePoolBalance,
      amm2Pool,
    ],
    async () => {
      if (!enabled) return;
      const spotPrices: MarketPrices =
        market?.status !== "Resolved"
          ? market.scoringRule === ScoringRule.AmmCdaHybrid ||
            market.scoringRule === ScoringRule.Lmsr
            ? calcMarketPricesAmm2(amm2Pool!, market)
            : calcMarketPrices(market, basePoolBalance!, balances!)
          : calcResolvedMarketPrices(market);

      return spotPrices;
    },
    {
      enabled: enabled,
    },
  );

  return query;
};

const calcMarketPricesAmm2 = (pool: Amm2Pool, market?: any) => {
  const spotPrices: MarketPrices = new Map();
  
  // Check if this is a combinatorial market (all keys are hex strings)
  const isCombinatorialMarket = Array.from(pool.reserves.keys()).every(
    key => typeof key === 'string' && key.startsWith('0x')
  );
  
  if (isCombinatorialMarket) {
    // For combinatorial markets, we need to sort the assets to match the market.outcomeAssets order
    // This ensures that the spot prices are returned in the correct order for category mapping
    let orderedAssetIds = [...pool.assetIds];
    
    if (market?.outcomeAssets) {
      // Sort pool.assetIds to match the order in market.outcomeAssets
      orderedAssetIds = [...pool.assetIds].sort((a, b) => {
        if (!('CombinatorialToken' in a) || !('CombinatorialToken' in b)) return 0;
        
        // Find indices in market.outcomeAssets
        const aIndex = market.outcomeAssets.findIndex((marketAsset: any) => {
          if (typeof marketAsset === 'string') {
            try {
              const parsed = JSON.parse(marketAsset);
              return parsed.combinatorialToken === a.CombinatorialToken;
            } catch {
              return false;
            }
          }
          return JSON.stringify(marketAsset) === JSON.stringify(a);
        });
        
        const bIndex = market.outcomeAssets.findIndex((marketAsset: any) => {
          if (typeof marketAsset === 'string') {
            try {
              const parsed = JSON.parse(marketAsset);
              return parsed.combinatorialToken === b.CombinatorialToken;
            } catch {
              return false;
            }
          }
          return JSON.stringify(marketAsset) === JSON.stringify(b);
        });
        
        return aIndex - bIndex;
      });
    }
    
    orderedAssetIds.forEach((assetId, index) => {
      let reserve: Decimal | undefined;
      
      if ('CombinatorialToken' in assetId) {
        // This is a combinatorial token
        reserve = pool.reserves.get(assetId.CombinatorialToken);
      } else if (IOMarketOutcomeAssetId.is(assetId)) {
        // Regular market outcome asset (shouldn't happen in combinatorial markets)
        const outcomeKey = IOCategoricalAssetId.is(assetId)
          ? assetId.CategoricalOutcome[1]
          : assetId.ScalarOutcome[1];
        reserve = pool.reserves.get(outcomeKey);
      }
      
      if (reserve) {
        const spotPrice = calculateSpotPrice(reserve, pool.liquidity);
        if (!spotPrice.isNaN()) {
          spotPrices.set(index, spotPrice);
        }
      }
    });
  } else {
    // Regular market: iterate through reserves with their keys
    pool.reserves.forEach((reserve, key) => {
      const spotPrice = calculateSpotPrice(reserve, pool.liquidity);

      if (!spotPrice.isNaN()) {
        // For numeric keys (categorical outcomes), use them directly
        if (typeof key === 'number') {
          spotPrices.set(key, spotPrice);
        } else if (key === 'Long') {
          // Scalar market: Long is index 1
          spotPrices.set(1, spotPrice);
        } else if (key === 'Short') {
          // Scalar market: Short is index 0
          spotPrices.set(0, spotPrice);
        }
      }
    });
  }

  return spotPrices;
};

const calcMarketPrices = (
  market: FullMarketFragment,
  basePoolBalance: Decimal,
  balances: OrmlTokensAccountData[],
) => {
  const spotPrices: MarketPrices = new Map();

  if (!market.pool) return spotPrices;

  // Create a map to track outcome indices for each weight
  const outcomeWeightsWithIndex: Array<{ weight: typeof market.pool.weights[0], outcomeIndex: number }> = [];
  
  market.pool.weights.forEach((weight) => {
    // Skip base asset
    if (weight.assetId.toLocaleLowerCase() === market.baseAsset.toLocaleLowerCase()) {
      return;
    }
    
    // Parse the asset ID to get the outcome index
    const assetId = parseAssetIdString(weight.assetId);
    if (IOMarketOutcomeAssetId.is(assetId)) {
      let outcomeIndex: number;
      
      if (IOCategoricalAssetId.is(assetId)) {
        // For categorical markets, use the outcome index directly
        outcomeIndex = assetId.CategoricalOutcome[1];
      } else if (IOScalarAssetId.is(assetId)) {
        // For scalar markets, map Long/Short to indices
        const scalarOutcome = assetId.ScalarOutcome[1];
        outcomeIndex = scalarOutcome === 'Long' ? 1 : 0;
      } else {
        // Default fallback
        outcomeIndex = 0;
      }
      
      outcomeWeightsWithIndex.push({ weight, outcomeIndex });
    }
  });

  //base weight is equal to the sum of all other assets
  const baseWeight = new Decimal(market?.pool.totalWeight ?? 0).div(2);

  outcomeWeightsWithIndex.forEach(({ weight, outcomeIndex }, arrayIndex) => {
    const spotPrice = calcSpotPrice(
      basePoolBalance.toString(),
      baseWeight,
      balances[arrayIndex].free.toString(),
      weight.weight,
      0,
    );

    if (!spotPrice.isNaN()) {
      spotPrices.set(outcomeIndex, spotPrice);
    }
  });

  return spotPrices;
};
