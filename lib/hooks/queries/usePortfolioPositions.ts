import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  AssetId,
  CategoricalAssetId,
  Context,
  parseAssetId,
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
  IndexedPool,
  IOMarketOutcomeAssetId,
  IOPoolShareAssetId,
  IOZtgAssetId,
  ZTG,
  PoolShareAssetId,
  ScalarAssetId,
  IOForeignAssetId,
  IOCategoricalAssetId,
  IOScalarAssetId,
} from "@zeitgeistpm/sdk";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import Decimal from "decimal.js";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountTokenPositions } from "lib/hooks/queries/useAccountTokenPositions";
import { useMarketsByIds } from "lib/hooks/queries/useMarketsByIds";
import { usePoolAccountIds } from "lib/hooks/queries/usePoolAccountIds";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { calcResolvedMarketPrices } from "lib/util/calc-resolved-market-prices";
import { VirtualMarket } from "lib/types";
import { useMemo } from "react";
import { MarketBond, useAccountBonds } from "./useAccountBonds";
import { useChainTime } from "lib/state/chaintime";
import { TradeHistoryItem, useTradeHistory } from "./useTradeHistory";
import {
  ForeignAssetPrices,
  useAllForeignAssetUsdPrices,
} from "./useAssetUsdPrice";
import { ScoringRule } from "@zeitgeistpm/indexer";
import {
  lookupAssetPrice,
  useAmm2MarketSpotPrices,
} from "./useAmm2MarketSpotPrices";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { useCombinatorialTokenMarketIds } from "./useCombinatorialTokenMarketIds";
import { useMultiMarketAssets } from "./useMultiMarketAssets";
import { AssetWithNullMarket } from "lib/gql/combo-pools";
import { useMultipleAmm2Pools } from "./amm2/useMultipleAmm2Pools";

// Synthetic market ID offset to avoid collisions with real market IDs
const SYNTHETIC_MARKET_ID_OFFSET = 1000000;

export type UsePortfolioPositions = {
  /**
   * All positions in the portfolio.
   */
  all?: Position[];
  /**
   * The trading positions in the portfolio.
   */
  markets?: Position<CategoricalAssetId | ScalarAssetId>[];
  /**
   * The pool share positions(liquidity) in the portfolio.
   */
  subsidy?: Position<PoolShareAssetId>[];
  /**
   * Total breakdwon of the portfolio with total value and changes.
   */
  breakdown?: PorfolioBreakdown;
};

export type Position<T extends AssetId = AssetId> = {
  /**
   * The asset id of the position.
   */
  assetId: T;
  /**
   * The market of the position.
   */
  market: FullMarketFragment;
  /**
   * The cpmm pool related to the position.
   */
  pool?: IndexedPool<Context>;
  /**
   * The outcome of the position. Name of the outcome.
   */
  outcome: string;
  /**
   * The color of the outcome asset
   */
  color: string;
  /**
   * The current price of the position.
   */
  price: Decimal;
  /**
   * The price of the position 24 hours ago.
   */
  avgCost: number;
  /**
   * The average cost of acquiring the position of the asset.
   */
  upnl: number;
  /**
   * The total cost of acquisition from the total unrealized amount from selling based off current price.
   */
  rpnl: number;
  /**
   * The total cost of acquisition from the total amount received from selling.
   */
  price24HoursAgo: Decimal;
  /**
   * The balance the user has of the positions asset.
   */
  userBalance: Decimal;
  /**
   * The total issuance of the positions pool shares.
   * @nb This is only available for pool share positions.
   */
  totalIssuance?: Decimal;
  /**
   * The change in the price of the position the last 24 hours.
   */
  changePercentage: number;
  /**
   * Indicates if this is a multi-market position that should link to multi-market/[poolid]
   */
  isMultiMarket?: boolean;
  /**
   * The pool ID for multi-market positions
   */
  poolId?: number;
  /**
   * The underlying market IDs for multi-market positions
   */
  underlyingMarketIds?: number[];
  /**
   * Indicates if tokens can be redeemed (for multi-market positions when markets are closed)
   */
  canRedeem?: boolean;
  /**
   * Indicates if this specific position is a winning/redeemable position
   */
  isWinningPosition?: boolean;
};

export type PorfolioBreakdown = {
  /**
   * The total value of the portfolio in ztg(planck)
   */
  total: {
    value: Decimal;
    changePercentage: number;
  };
  /**
   * The value of the trading positions in ztg(planck)
   */
  tradingPositions: {
    value: Decimal;
    changePercentage: number;
  };
  /**
   * The value of the subsidy in ztg(planck)
   */
  subsidy: {
    value: Decimal;
    changePercentage: number;
  };
  /**
   * The value of the bonded in ztg(planck)
   */
  bonded: {
    value: Decimal;
    changePercentage: number;
  };
  /**
   * The price of ztg in usd.
   */
  usdZtgPrice?: Decimal;
};

/**
 * Hook to get the portfolio positions of a users address.
 *
 * @param address string | null - the address to create portfolio breakdown for.
 * @returns UsePortfolioPositions
 */
export const usePortfolioPositions = (
  address?: string,
): UsePortfolioPositions => {
  const now = useChainTime();
  const { data: ztgPrice } = useZtgPrice();
  const block24HoursAgo = now?.block ? Math.floor(now?.block - 7200) : NaN;
  const { data: marketBonds, isLoading: isBondsLoading } =
    useAccountBonds(address);
  const { data: foreignAssetPrices } = useAllForeignAssetUsdPrices();

  const { data: tradeHistory, isLoading: isTradeHistoryLoading } =
    useTradeHistory(address);

  const rawPositions = useAccountTokenPositions(address);

  
  // Extract all combinatorial tokens
  const combinatorialTokens = rawPositions.data
    ?.map((position) => {
      const assetId = (parseAssetIdStringWithCombinatorial as any)(position.assetId);
      if (isCombinatorialToken(assetId)) {
        return assetId.CombinatorialToken;
      }
      return null;
    })
    .filter(isNotNull) ?? [];

  // Fetch market IDs for all combinatorial tokens
  // Note: This hook has internal enabled logic based on combinatorialTokens.length
  const { data: combinatorialMarketIds, isLoading: isLoadingCombinatorialMarketIds } = useCombinatorialTokenMarketIds(
    combinatorialTokens
  );

  // Process multi-market tokens only after data is loaded
  const multiMarketTokenIds = useMemo(() => {
    if (!combinatorialMarketIds) return [];
    return Object.entries(combinatorialMarketIds)
      .filter(([key, value]) => value === null)
      .map(([key]) => key);
  }, [combinatorialMarketIds]);

  // Format for GraphQL where clause
  const multiMarketAssets = useMemo(() => {
    return multiMarketTokenIds.map(id => `"combinatorialToken":"${id}"`);
  }, [multiMarketTokenIds]);

  // Query for multi-market assets
  // Note: This hook has internal enabled logic based on multiMarketAssets.length
  const {
    data: multiMarketAssetsData,
    isLoading: isLoadingMultiMarketAssets,
  } = useMultiMarketAssets(multiMarketAssets);

  // Create a map for quick lookup of multi-market assets
  const multiMarketAssetMap = useMemo(() => {
    const map = new Map<string, AssetWithNullMarket>();
    multiMarketAssetsData?.forEach(asset => {
      // Extract token hash from the JSON string format
      const match = asset.assetId.match(/"0x([a-f0-9]+)"/);
      if (match) {
        map.set(`0x${match[1]}`, asset);
      }
    });
    return map;
  }, [multiMarketAssetsData]);

  const filter = rawPositions.data
    ?.map((position) => {
      const assetId = (parseAssetIdStringWithCombinatorial as any)(position.assetId);

      if (IOMarketOutcomeAssetId.is(assetId)) {
        return {
          marketId: getMarketIdOf(assetId as any),
          type: 'single-market' as const
        };
      }
      if (IOPoolShareAssetId.is(assetId)) {
        return {
          poolId: assetId.PoolShare,
          type: 'pool-share' as const
        };
      }
      if (isCombinatorialToken(assetId)) {
        // First check if it's a single market combinatorial token
        const marketId = combinatorialMarketIds?.[assetId.CombinatorialToken];
        if (marketId != null) {
          return {
            marketId: marketId,
            type: 'single-market-combo' as const
          };
        }

        // Then check if it's a multi-market combinatorial token
        const multiMarketAsset = multiMarketAssetMap.get(assetId.CombinatorialToken);
        if (multiMarketAsset && multiMarketAsset.poolId != null) {
          return {
            poolId: multiMarketAsset.poolId,
            marketIds: multiMarketAsset.marketIds,
            type: 'multi-market-combo' as const,
            assetInfo: multiMarketAsset
          };
        }
        return null;
      }
      return null;
    }).filter(isNotNull)

  // Extract unique pool IDs from filter results for multi-market assets
  const uniqueMultiMarketPoolIds = useMemo(() => {
    const poolIds = new Set<number>();
    filter?.forEach(f => {
      if (f.type === 'multi-market-combo' && 'poolId' in f && f.poolId) {
        poolIds.add(f.poolId);
      }
    });
    return Array.from(poolIds);
  }, [filter]);

  // Use custom hook to get pool data for all multi-market pools
  // Note: This hook has internal enabled logic based on poolIds.length
  const multiMarketPoolsQuery = useMultipleAmm2Pools(uniqueMultiMarketPoolIds);
  const multiMarketPoolDataMap = multiMarketPoolsQuery.data ?? new Map();

  const pools = usePoolsByIds(filter);
  // Collect all market IDs including those from multi-market pools
  // Exclude synthetic market IDs (they don't exist in the database)
  const allMarketIdsFilter = useMemo(() => {
    const marketFilters: Array<{ marketId: number }> = [];
    const seenMarketIds = new Set<number>();

    filter?.forEach(f => {
      if ('marketId' in f && f.marketId && !seenMarketIds.has(f.marketId)) {
        // Skip synthetic market IDs - they don't exist in the database
        if (f.marketId < SYNTHETIC_MARKET_ID_OFFSET) {
          marketFilters.push({ marketId: f.marketId });
          seenMarketIds.add(f.marketId);
        }
      }
      // Add market IDs from multi-market pools (these are real market IDs)
      if ('marketIds' in f && Array.isArray(f.marketIds)) {
        f.marketIds.forEach(id => {
          if (!seenMarketIds.has(id) && id < SYNTHETIC_MARKET_ID_OFFSET) {
            marketFilters.push({ marketId: id });
            seenMarketIds.add(id);
          }
        });
      }
    });

    return marketFilters;
  }, [filter]);

  const markets = useMarketsByIds(allMarketIdsFilter);

  const amm2MarketIds = markets.data
    ?.filter(
      (market) =>
        market.scoringRule === ScoringRule.AmmCdaHybrid ||
        market.scoringRule === ScoringRule.Lmsr,
    )
    .map((m) => m.marketId);

  const { data: amm2SpotPrices } = useAmm2MarketSpotPrices(amm2MarketIds);

  const { data: amm2SpotPrices24HoursAgo } = useAmm2MarketSpotPrices(
    amm2MarketIds,
    block24HoursAgo,
  );

  const poolAccountIds = usePoolAccountIds(pools.data);

  const poolsTotalIssuance = useTotalIssuanceForPools(
    pools.data?.map((p) => p.poolId) ?? [],
  );

  const poolAssetBalancesFilter =
    rawPositions.data
      ?.flatMap((position) => {
        const assetId = (parseAssetIdStringWithCombinatorial as any)(position.assetId);

        // Skip combinatorial tokens for pool asset balance queries
        if (isCombinatorialToken(assetId)) {
          return null;
        }

        const pool = pools.data?.find((pool) => {
          if (IOPoolShareAssetId.is(assetId)) {
            return pool.poolId === assetId.PoolShare;
          }
          if (IOMarketOutcomeAssetId.is(assetId)) {
            return pool.marketId === getMarketIdOf(assetId as any);
          }
        });

        if (!pool) return null;

        const assetIds = pool.weights
          .map((w) => parseAssetIdStringWithCombinatorial(w.assetId))
          .filter(IOMarketOutcomeAssetId.is.bind(IOMarketOutcomeAssetId));

        return assetIds.map((assetId) => ({
          assetId: assetId as any,
          account: poolAccountIds[pool.poolId],
        }));
      })
      .filter(isNotNull) ?? [];

  //Todo: we can use useAccountTokenPositions for this to reduce it to a single query issue #1945
  const poolAssetBalances = useAccountAssetBalances(poolAssetBalancesFilter);

  const poolAssetBalances24HoursAgo = useAccountAssetBalances(
    poolAssetBalancesFilter,
    block24HoursAgo,
    { enabled: Boolean(now?.block) },
  );

  const userAssetBalances = useAccountAssetBalances(
    rawPositions.data?.map((position) => ({
      assetId: (parseAssetIdStringWithCombinatorial as any)(position.assetId),
      account: address,
    })) ?? [],
  );

  const positions = useMemo<Position[] | null>(() => {
    const stillLoading =
      rawPositions.isLoading ||
      pools.isLoading ||
      markets.isLoading ||
      !ztgPrice ||
      poolAssetBalances.isLoading ||
      !poolsTotalIssuance ||
      userAssetBalances.isLoading ||
      poolAssetBalances24HoursAgo.isLoading ||
      isTradeHistoryLoading ||
      isLoadingCombinatorialMarketIds ||
      isLoadingMultiMarketAssets ||
      multiMarketPoolsQuery.isLoading ||
      multiMarketPoolsQuery.isFetching;

    if (stillLoading) {
      return null;
    }

    let positionsData: Position[] = [];

    for (const position of rawPositions?.data ?? []) {
      const assetId = (parseAssetIdStringWithCombinatorial as any)(position.assetId);

      let pool: IndexedPool<Context> | undefined;
      let marketId: number | undefined;
      let market: FullMarketFragment | undefined;

      if (IOZtgAssetId.is(assetId) || IOForeignAssetId.is(assetId)) {
        continue;
      }

      if (IOPoolShareAssetId.is(assetId)) {
        pool = pools?.data?.find((pool) => pool.poolId === assetId.PoolShare);
        marketId = pool?.marketId;
        market = markets.data?.find((m) => m.marketId === marketId);
      }

      if (IOMarketOutcomeAssetId.is(assetId)) {
        marketId = getMarketIdOf(assetId as any);
        market = markets.data?.find((m) => m.marketId === marketId);
        pool = pools.data?.find((pool) => pool.marketId === marketId);
      }

      if (isCombinatorialToken(assetId)) {
        // First check for single market combinatorial token
        marketId = combinatorialMarketIds?.[assetId.CombinatorialToken];
        if (marketId != null) {
          market = markets.data?.find((m) => m.marketId === marketId);
          pool = pools.data?.find((pool) => pool.marketId === marketId);
        } else {
          // Check if it's a multi-market combinatorial token
          const multiMarketAsset = multiMarketAssetMap.get(assetId.CombinatorialToken);
          if (multiMarketAsset && multiMarketAsset.poolId != null) {
            // Create a synthetic market from the component markets
            const market1 = markets.data?.find((m) => m.marketId === multiMarketAsset.marketIds[0]);
            const market2 = markets.data?.find((m) => m.marketId === multiMarketAsset.marketIds[1]);
            // Get pool data for this specific multi-market pool
            const poolData = multiMarketPoolDataMap.get(multiMarketAsset.poolId);

            if (market1 && market2 && poolData) {

              // Get properly ordered assets from useMultipleAmm2Pools
              const orderedAssets = poolData.assetIds;

              // Generate combined categories for outcome naming following the same logic as useVirtualMarket
              const combinedCategories: Array<{ name: string; color: string }> = [];
              const outcomeAssets: string[] = [];
              const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

              // The marketIds array order determines which market is "first" and "second"
              // marketIds[0] is market1 (outer loop), marketIds[1] is market2 (inner loop)
              // This matches the useVirtualMarket logic
              let colorIndex = 0;
              let assetIndex = 0;

              market1.categories?.forEach((cat1, i) => {
                market2.categories?.forEach((cat2, j) => {
                  const assetFromPool = orderedAssets[assetIndex];

                  combinedCategories.push({
                    name: `${cat1.name} & ${cat2.name}`,
                    color: colors[colorIndex % colors.length]
                  });

                  // Add the actual asset ID for matching - use the properly ordered asset
                  if (assetFromPool) {
                    // Convert the asset to JSON string format for consistent comparison
                    outcomeAssets.push(JSON.stringify(assetFromPool));
                  }

                  colorIndex++;
                  assetIndex++;
                });
              });

              // Create synthetic market
              // Use a large offset to avoid collision with real market IDs
              // Real market IDs are sequential from 0, so using offset + poolId ensures uniqueness
              const syntheticMarketId = SYNTHETIC_MARKET_ID_OFFSET + multiMarketAsset.poolId;

              // Calculate combined resolved outcome if both markets are resolved
              // Multi-markets structure: market1 is parent, market2 is child
              // Outcomes are organized as: [Parent0-Child0, Parent0-Child1, ..., Parent1-Child0, Parent1-Child1, ...]
              // Formula: tokenIndex = (parentOutcome * numChildOutcomes) + childOutcome
              let combinedResolvedOutcome: string | null = null;
              let syntheticStatus = market1.status === 'Active' && market2.status === 'Active' ? 'Active' : 'Closed';

              const isParentScalar = market1.marketType?.scalar !== null;
              const isChildScalar = market2.marketType?.scalar !== null;

              if (market1.resolvedOutcome !== null && market2.resolvedOutcome !== null) {
                // For categorical markets, resolvedOutcome is an index (0, 1, 2, etc.)
                // For scalar markets, resolvedOutcome is the numeric value (e.g., "800000000000")
                // Scalar markets have 2 outcomes: Short (index 0) and Long (index 1)

                let parentResolvedIndex: number;
                let childResolvedIndex: number;

                if (isParentScalar) {
                  // Parent is scalar - we can't determine a single index, need special handling
                  combinedResolvedOutcome = null;
                } else {
                  parentResolvedIndex = typeof market1.resolvedOutcome === 'string'
                    ? parseInt(market1.resolvedOutcome)
                    : market1.resolvedOutcome ?? 0;

                  if (isChildScalar) {
                    // Parent categorical, child scalar - resolvedOutcome represents parent only
                    // Both Short and Long positions for this parent outcome are redeemable
                    combinedResolvedOutcome = parentResolvedIndex.toString();
                  } else {
                    // Both categorical - standard combo index calculation
                    childResolvedIndex = typeof market2.resolvedOutcome === 'string'
                      ? parseInt(market2.resolvedOutcome)
                      : market2.resolvedOutcome ?? 0;
                    const numChildOutcomes = market2.categories?.length || 0;

                    const comboIndex = (parentResolvedIndex * numChildOutcomes) + childResolvedIndex;
                    combinedResolvedOutcome = comboIndex.toString();
                  }
                }
                syntheticStatus = 'Resolved';
              }

              market = {
                ...market1, // Use market1 as base structure
                marketId: syntheticMarketId, // Use synthetic marketId to avoid collisions
                question: `${market1.question} & ${market2.question}`,
                description: `Combinatorial market: ${market1.question} and ${market2.question}`,
                categories: combinedCategories,
                outcomeAssets: outcomeAssets, // Now populated with actual asset IDs
                status: syntheticStatus,
                resolvedOutcome: combinedResolvedOutcome,
                pool: null, // Multi-market pools are handled differently
                neoPool: poolData
                  ? {
                      ...poolData,
                      _debug: {
                        isParentScalar,
                        isChildScalar,
                      },
                    }
                  : null,
              } as FullMarketFragment;

              pool = pools.data?.find((p) => p.poolId === multiMarketAsset.poolId);
            }
          }
        }
      }

      if (!market) {
        continue;
      }

      const balance = address
        ? userAssetBalances?.get(address, assetId as any)?.data?.balance
        : undefined;
      const totalIssuanceForPoolQuery = pool && poolsTotalIssuance[pool.poolId];
      const totalIssuanceData = pool && poolsTotalIssuance[pool.poolId]?.data;

      const userBalance = balance ?? new Decimal(0);

      const totalIssuance =
        totalIssuanceForPoolQuery &&
        new Decimal(
          totalIssuanceForPoolQuery.data?.totalIssuance.toString() ?? 0,
        );

      let price: Decimal | undefined;
      let price24HoursAgo: Decimal | undefined;

      if (IOMarketOutcomeAssetId.is(assetId)) {
        if (market.status === "Resolved") {
          price = calcResolvedMarketPrices(market).get(getIndexOf(assetId as any));
          price24HoursAgo = price;
        } else {
          if (
            market.scoringRule === ScoringRule.AmmCdaHybrid ||
            market.scoringRule === ScoringRule.Lmsr
          ) {
            price = lookupAssetPrice(assetId as any, amm2SpotPrices);

            price24HoursAgo = lookupAssetPrice(
              assetId as any,
              amm2SpotPrices24HoursAgo,
            );
          }
        }
      }

      // Handle combinatorial tokens
      if (isCombinatorialToken(assetId)) {
        if (market.status === "Resolved") {
          // TODO: Handle resolved combinatorial token prices
          price = new Decimal(0);
          price24HoursAgo = price;
        } else {
          if (
            market.scoringRule === ScoringRule.AmmCdaHybrid ||
            market.scoringRule === ScoringRule.Lmsr
          ) {
            price = lookupAssetPrice(assetId as any, amm2SpotPrices);
            price24HoursAgo = lookupAssetPrice(
              assetId as any,
              amm2SpotPrices24HoursAgo,
            );
          }
        }
      }

      let outcome = IOCategoricalAssetId.is(assetId)
        ? market.categories?.[getIndexOf(assetId as any)]?.name ??
          JSON.stringify(assetId.CategoricalOutcome)
        : IOScalarAssetId.is(assetId)
          ? getIndexOf(assetId as any) == 1
            ? "Short"
            : "Long"
          : isCombinatorialToken(assetId)
          ? (() => {
              // For combinatorial tokens, find the index in outcomeAssets
              // The assetId has uppercase CombinatorialToken, but outcomeAssets has lowercase
              const tokenHash = assetId.CombinatorialToken;
              
              const index = market.outcomeAssets?.findIndex(
                (outcomeAsset) => {
                  // outcomeAsset is a JSON string like "{\"combinatorialToken\":\"0x...\"}"
                  // We need to check if it contains the same hash
                  return outcomeAsset.includes(tokenHash);
                }
              );
              
              if (index !== undefined && index >= 0 && market.categories?.[index]) {
                return market.categories[index].name;
              }
              
              // No mapping found - show N/A
              return "N/A";
            })()
          : "unknown";

      let color = IOCategoricalAssetId.is(assetId)
        ? market.categories?.[getIndexOf(assetId as any)]?.color ?? "#ffffff"
        : IOScalarAssetId.is(assetId)
          ? getIndexOf(assetId as any) == 1
            ? "rgb(255, 0, 0)"
            : "rgb(36, 255, 0)"
          : isCombinatorialToken(assetId)
          ? (() => {
              // For combinatorial tokens, find the index in outcomeAssets
              const tokenHash = assetId.CombinatorialToken;
              
              const index = market.outcomeAssets?.findIndex(
                (outcomeAsset) => {
                  // Check if outcomeAsset contains the same hash
                  return outcomeAsset.includes(tokenHash);
                }
              );
              
              if (index !== undefined && index >= 0 && market.categories?.[index]) {
                return market.categories[index].color || "#999999";
              }
              
              return "#999999"; // Gray for unknown combinatorial tokens
            })()
          : "unknown";

      if (IOPoolShareAssetId.is(assetId)) {
        outcome = "Pool Share";
        color = "#DF0076";
      }

      // For multi-market positions, we need to check against the actual market IDs
      const multiMarketAsset = isCombinatorialToken(assetId)
        ? multiMarketAssetMap.get(assetId.CombinatorialToken)
        : null;
      const marketIdsToCheck = multiMarketAsset?.marketIds
        ? multiMarketAsset.marketIds
        : marketId ? [marketId] : [];

      const avgCost = tradeHistory
        ?.filter((transaction) => transaction !== undefined)
        ?.filter((transaction) => marketIdsToCheck.includes(transaction.marketId))
        .reduce((acc, transaction) => {
          const assetIn = transaction.assetAmountOut.div(ZTG).toNumber();
          let totalAssets = 0;
          let totalCost = 0;
          const price = transaction.price.toNumber();
          if (transaction.assetOut === outcome) {
            if (transaction.assetIn === transaction.baseAssetName) {
              totalCost += assetIn * price;
              totalAssets += assetIn;
            }
            if (totalAssets > 0 && totalCost > 0) {
              acc = totalCost / totalAssets;
            }
          }
          return acc;
        }, 0);

      const calculateFifoPnl = (transactions: TradeHistoryItem[]) => {
        let buys: Array<{ quantity: number; price: number }> = [];
        let pnl = 0;

        transactions
          .filter(
            (transaction) =>
              marketIdsToCheck.includes(transaction.marketId) &&
              (transaction.assetIn === outcome ||
                transaction.assetOut === outcome),
          )
          .sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
          )
          .forEach(
            ({
              assetIn,
              assetAmountIn,
              assetAmountOut,
              price,
              baseAssetName,
            }) => {
              const quantity = assetAmountIn.div(ZTG).toNumber();
              const transactionPrice = price.toNumber();

              if (assetIn === baseAssetName) {
                buys.push({ quantity, price: transactionPrice });
              } else {
                let remainingToSell = assetAmountOut.div(ZTG).toNumber();

                while (remainingToSell > 0 && buys.length > 0) {
                  const [currentBuy] = buys;
                  const sellQuantityFromThisBuy = Math.min(
                    currentBuy.quantity,
                    remainingToSell,
                  );

                  pnl +=
                    sellQuantityFromThisBuy *
                    (transactionPrice - currentBuy.price);

                  remainingToSell -= sellQuantityFromThisBuy;
                  currentBuy.quantity -= sellQuantityFromThisBuy;

                  if (currentBuy.quantity === 0) {
                    buys = buys.slice(1);
                  }
                }
              }
            },
          );
        return pnl;
      };

      const calculateUnrealizedPnL = (
        transactions: TradeHistoryItem[],
        avgCost: number,
        currentMarketPrice: number,
      ) => {
        const filteredTransactions = transactions.filter(
          (transaction) =>
            marketIdsToCheck.includes(transaction.marketId) &&
            (transaction.assetIn === outcome ||
              transaction.assetOut === outcome),
        );
        const { totalQuantity } = filteredTransactions.reduce(
          (acc, transaction) => {
            if (transaction.assetIn === transaction.baseAssetName) {
              const quantity = transaction.assetAmountOut.div(ZTG).toNumber();
              return {
                totalQuantity: acc.totalQuantity + quantity,
              };
            } else if (transaction.assetIn === outcome) {
              const quantity = transaction.assetAmountIn.div(ZTG).toNumber();
              return {
                totalQuantity: acc.totalQuantity - quantity,
              };
            } else {
              return acc;
            }
          },
          { totalQuantity: 0 },
        );
        return (currentMarketPrice - avgCost) * totalQuantity;
      };

      const change = diffChange(
        new Decimal(price ?? 0),
        new Decimal(price24HoursAgo ?? 0),
      );

      if (!price) {
        price = new Decimal(0);
      }

      if (!price24HoursAgo) {
        price24HoursAgo = new Decimal(0);
      }

      // Determine if this is a multi-market position
      let isMultiMarket = false;
      let poolIdForRouting: number | undefined;
      let canRedeem = false;
      let isWinningPosition = false;

      if (isCombinatorialToken(assetId)) {
        const multiMarketAsset = multiMarketAssetMap.get(assetId.CombinatorialToken);
        if (multiMarketAsset && multiMarketAsset.poolId != null) {
          isMultiMarket = true;
          poolIdForRouting = multiMarketAsset.poolId;

          // Check if any of the underlying markets are closed for redemption eligibility
          const underlyingMarkets = multiMarketAsset.marketIds
            .map(id => markets.data?.find((m) => m.marketId === id))
            .filter(isNotNull);

          // Enable redemption if at least one market is not Active
          canRedeem = underlyingMarkets.some(m => m.status !== 'Active');

          // Determine if this position is a winning/redeemable position
          if (market.status === 'Resolved' && market.resolvedOutcome !== null) {
            const tokenIndex = market.outcomeAssets?.findIndex(
              asset => asset.includes(assetId.CombinatorialToken)
            );

            if (tokenIndex !== -1 && tokenIndex !== undefined) {
              const vm = market as VirtualMarket;
              const isParentScalar = vm.neoPool?.isParentScalar ?? false;
              const isChildScalar = vm.neoPool?.isChildScalar ?? false;

              if (!isParentScalar && isChildScalar) {
                // Parent categorical, child scalar: check if parent matches
                const parentIndex = Math.floor(tokenIndex / 2);
                isWinningPosition = parentIndex === Number(market.resolvedOutcome);
              } else if (!isParentScalar && !isChildScalar) {
                // Both categorical: exact match
                isWinningPosition = tokenIndex === Number(market.resolvedOutcome);
              } else if (isParentScalar) {
                // Parent scalar: all positions may have value
                isWinningPosition = true;
              }
            }
          }
        }
      }

      positionsData.push({
        assetId: assetId as AssetId,
        market,
        pool,
        price,
        avgCost,
        upnl: calculateUnrealizedPnL(tradeHistory, avgCost, price.toNumber()),
        rpnl: calculateFifoPnl(tradeHistory),
        price24HoursAgo,
        outcome: outcome || "Unknown",
        color,
        userBalance,
        changePercentage: change,
        totalIssuance,
        isMultiMarket,
        poolId: poolIdForRouting,
        underlyingMarketIds: isMultiMarket && isCombinatorialToken(assetId)
          ? multiMarketAssetMap.get(assetId.CombinatorialToken)?.marketIds
          : undefined,
        canRedeem,
        isWinningPosition,
      });
    }

    return positionsData;
  }, [
    rawPositions,
    pools,
    markets,
    ztgPrice,
    poolsTotalIssuance,
    userAssetBalances,
    poolAssetBalances,
    poolAssetBalances24HoursAgo,
    isTradeHistoryLoading,
  ]);

  const marketPositions = useMemo<
    Position<CategoricalAssetId | ScalarAssetId>[] | null
  >(
    () =>
      (positions?.filter(
        (position) =>
          IOMarketOutcomeAssetId.is(position.assetId) || isCombinatorialToken(position.assetId),
      ) as Position<CategoricalAssetId | ScalarAssetId>[]) ?? null,
    [positions],
  );

  const subsidyPositions = useMemo<Position<PoolShareAssetId>[] | null>(
    () =>
      positions?.filter((position): position is Position<PoolShareAssetId> =>
        IOPoolShareAssetId.is(position.assetId),
      ) ?? null,
    [positions],
  );

  const breakdown = useMemo<PorfolioBreakdown | null>(() => {
    if (
      !ztgPrice ||
      !marketPositions ||
      !subsidyPositions ||
      isBondsLoading ||
      !foreignAssetPrices
    ) {
      return null;
    }

    const tradingPositionsTotal = totalPositionsValue(
      marketPositions,
      "price",
      foreignAssetPrices,
      ztgPrice,
    );
    const tradingPositionsTotal24HoursAgo = totalPositionsValue(
      marketPositions,
      "price24HoursAgo",
      foreignAssetPrices,
      ztgPrice,
    );

    const tradingPositionsChange = diffChange(
      tradingPositionsTotal,
      tradingPositionsTotal24HoursAgo,
    );

    const subsidyPositionsTotal = totalPositionsValue(
      subsidyPositions,
      "price",
      foreignAssetPrices,
      ztgPrice,
    );

    const subsidyPositionsTotal24HoursAgo = totalPositionsValue(
      subsidyPositions,
      "price24HoursAgo",
      foreignAssetPrices,
      ztgPrice,
    );

    const subsidyPositionsChange = diffChange(
      subsidyPositionsTotal,
      subsidyPositionsTotal24HoursAgo,
    );

    const bondsTotal =
      marketBonds && marketBonds?.length > 0
        ? calcTotalBondsValue(marketBonds)
        : new Decimal(0);

    const positionsTotal = tradingPositionsTotal
      .plus(subsidyPositionsTotal)
      .plus(bondsTotal);
    const positionsTotal24HoursAgo = tradingPositionsTotal24HoursAgo
      .plus(subsidyPositionsTotal24HoursAgo)
      .plus(bondsTotal);

    const totalChange = diffChange(positionsTotal, positionsTotal24HoursAgo);

    return {
      usdZtgPrice: ztgPrice,
      total: {
        value: positionsTotal,
        changePercentage: isNaN(totalChange) ? 0 : totalChange,
      },
      tradingPositions: {
        value: tradingPositionsTotal,
        changePercentage: isNaN(tradingPositionsChange)
          ? 0
          : tradingPositionsChange,
      },
      subsidy: {
        value: subsidyPositionsTotal,
        changePercentage: isNaN(subsidyPositionsChange)
          ? 0
          : subsidyPositionsChange,
      },
      bonded: {
        value: bondsTotal,
        // TODO: load change
        changePercentage: 0,
      },
    };
  }, [
    ztgPrice,
    foreignAssetPrices,
    subsidyPositions,
    marketPositions,
    isBondsLoading,
    marketBonds,
  ]);

  return {
    all: positions ?? undefined,
    markets: marketPositions ?? undefined,
    subsidy: subsidyPositions ?? undefined,
    breakdown: breakdown ?? undefined,
  };
};

/**
 * Calculates the total value of a set of positions in ZTG
 */
export const totalPositionsValue = <
  K extends keyof Pick<Position, "price" | "price24HoursAgo">,
>(
  positions: Position[],
  key: K,
  foreignAssetPrices: ForeignAssetPrices,
  ztgPrice: Decimal,
): Decimal => {
  return positions.reduce((acc, position) => {
    const assetId = parseAssetIdStringWithCombinatorial(position.market.baseAsset);

    const priceMultiplier = IOForeignAssetId.is(assetId)
      ? foreignAssetPrices[assetId.ForeignAsset.toString()]?.div(ztgPrice)
      : 1;

    if (position.userBalance.isNaN() || position[key].isNaN()) {
      return acc;
    }
    if (!position[key]) return acc;

    const value = position.userBalance
      .mul(position[key])
      .mul(priceMultiplier ?? 0);

    return !value.isNaN() ? acc.plus(value) : acc;
  }, new Decimal(0));
};

/**
 * Calculates the difference between two decimals and returns the change in percentage.
 *
 * @param a Decimal
 * @param b Decimal
 * @returns number
 */
const diffChange = (a: Decimal, b: Decimal) => {
  const priceDiff = a?.minus(b);
  const priceChange = priceDiff?.div(b);
  return priceChange.mul(100).toNumber();
};

const calcTotalBondsValue = (marketBonds: MarketBond[]) => {
  const bondTotal = marketBonds?.reduce((total, marketBond) => {
    const creationBond = marketBond.bonds.creation;
    if (creationBond.isSettled === false) {
      total = total.plus(creationBond.value);
    }

    const oracleBond = marketBond.bonds.oracle;
    if (oracleBond.isSettled === false) {
      total = total.plus(oracleBond.value);
    }

    return total;
  }, new Decimal(0));

  return bondTotal;
};
