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
} from "./amm2/useAmm2MarketSpotPrices";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
import {
  CombinatorialToken,
  isCombinatorialToken,
} from "lib/types/combinatorial";
import { useAmm2MarketIdsToLegacyPoolIds } from "./amm2/useAmm2MarketIdsToLegacyPoolIds";

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

export type Position<
  T extends AssetId | CombinatorialToken = AssetId | CombinatorialToken,
> = {
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

  type FilterItem = { marketId: number } | { poolId: number };
  const { filter, combiTokens, combiPoolMap } = (
    rawPositions.data ?? []
  ).reduce<{
    filter: Set<FilterItem>;
    combiTokens: Set<CombinatorialToken>;
    // TODO replace any type with combi pool item
    // map combi pool id to pool information
    combiPoolMap: Map<number, any>;
  }>(
    (acc, position) => {
      const assetId: AssetId | CombinatorialToken = position.assetId;
      if (IOMarketOutcomeAssetId.is(assetId)) {
        const marketId = getMarketIdOf(assetId);
        if (!acc.filter.has({ marketId })) {
          acc.filter.add({ marketId });
        }
      } else if (IOPoolShareAssetId.is(assetId)) {
        const poolId = assetId.PoolShare;
        if (!acc.filter.has({ poolId })) {
          acc.filter.add({ poolId });
        }
      } else if (isCombinatorialToken(assetId)) {
        if (!acc.combiTokens.has(assetId)) {
          acc.combiTokens.add(assetId);

          // TODO: use indexer to get the mapping from combinatorial token to pool information (pool id, including market ids, pool account id)
          /*
          const combiPool = getCombiPoolOf(assetId);
          if (!acc.combiPoolMap.has(combiPool.poolId)) {
            acc.combiPoolMap.set(combiPool.poolId, combiPool);

            const combiPoolMarketIds = getMarketIdsOfCombiPool(
              combiPool.poolId,
            );
            for (const marketId of combiPoolMarketIds) {
              if (!acc.filter.has({ marketId })) {
                acc.filter.add({ marketId });
              }
            }
          }
          */
        }
      }
      return acc;
    },
    {
      filter: new Set<FilterItem>(),
      combiTokens: new Set<CombinatorialToken>(),
      combiPoolMap: new Map<number, any>(),
    },
  );

  const oldSwapPools = usePoolsByIds([...filter]);
  const markets = useMarketsByIds([...filter]);
  const amm2MarketIds = markets.data
    ?.filter(
      (market) =>
        market.scoringRule === ScoringRule.AmmCdaHybrid ||
        market.scoringRule === ScoringRule.Lmsr,
    )
    .map((m) => m.marketId);
  const { data: amm2MarketIdsToLegacyPoolIds } =
    useAmm2MarketIdsToLegacyPoolIds(amm2MarketIds);

  const { data: amm2SpotPrices } = useAmm2MarketSpotPrices(
    (amm2MarketIdsToLegacyPoolIds ?? []).concat([...combiPoolMap.keys()]),
  );

  const { data: amm2SpotPrices24HoursAgo } = useAmm2MarketSpotPrices(
    (amm2MarketIdsToLegacyPoolIds ?? []).concat([...combiPoolMap.keys()]),
    block24HoursAgo,
  );

  // the total issuance of pool shares in the amm2 pool is not available
  // TODO: it's rather important to know how much amount a liquidity provider has in the liquidity tree
  // TODO: also, the combinatorial token issuance could be queried
  const oldSwapPoolsTotalIssuance = useTotalIssuanceForPools(
    oldSwapPools.data?.map((p) => p.poolId) ?? [],
  );

  const userAssetBalances = useAccountAssetBalances(
    rawPositions.data?.map((position) => ({
      assetId: position.assetId,
      account: address,
    })) ?? [],
  );

  const positions = useMemo<Position[] | null>(() => {
    const stillLoading =
      rawPositions.isLoading ||
      oldSwapPools.isLoading ||
      markets.isLoading ||
      !ztgPrice ||
      !oldSwapPoolsTotalIssuance ||
      userAssetBalances.isLoading ||
      isTradeHistoryLoading;

    if (stillLoading) {
      return null;
    }

    let positionsData: Position[] = [];

    for (const position of rawPositions?.data ?? []) {
      const assetId = position.assetId;

      let pool: IndexedPool<Context> | undefined;
      let marketId: number | undefined;
      let market: FullMarketFragment | undefined;
      let marketsForCombiPool: FullMarketFragment[] | undefined;
      let marketIdsForCombiPool: number[] | undefined;

      if (IOZtgAssetId.is(assetId) || IOForeignAssetId.is(assetId)) {
        continue;
      }

      if (IOPoolShareAssetId.is(assetId)) {
        pool = oldSwapPools?.data?.find(
          (pool) => pool.poolId === assetId.PoolShare,
        );
        marketId = pool?.marketId;
        market = markets.data?.find((m) => m.marketId === marketId);
      }

      if (IOMarketOutcomeAssetId.is(assetId)) {
        marketId = getMarketIdOf(assetId);
        market = markets.data?.find((m) => m.marketId === marketId);
        // TODO: beware: there could be multiple combinatorial pools with this marketId. So, find the legacy (standard) pool
        // TODO: "oldSwapPools" does not include neo-swaps pools
        pool = oldSwapPools.data?.find((pool) => pool.marketId === marketId);
      }

      if (isCombinatorialToken(assetId)) {
        // TODO: allow combinatorial tokens that can have multiple markets associated with them
        /*
        pool = pools.data?.find(
          (pool) => pool.poolId === getPoolIdOf(assetId.CombinatorialToken),
        );
        marketsForCombiPool = markets.data?.filter((m) =>
          m.marketId in pool?.poolType?.combinatorial
            ? pool?.poolType?.combinatorial
            : false,
        );
        marketIdsForCombiPool = marketsForCombiPool?.map((m) => m.marketId);
        */
      }

      if (!market) {
        continue;
      }

      const balance = address
        ? userAssetBalances?.get(address, assetId)?.data?.balance
        : undefined;
      const totalIssuanceForPoolQuery =
        pool && oldSwapPoolsTotalIssuance[pool.poolId];

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
          price = calcResolvedMarketPrices(market).get(getIndexOf(assetId));
          price24HoursAgo = price;
        } else {
          if (
            market.scoringRule === ScoringRule.AmmCdaHybrid ||
            market.scoringRule === ScoringRule.Lmsr
          ) {
            price = lookupAssetPrice(assetId, amm2SpotPrices);

            price24HoursAgo = lookupAssetPrice(
              assetId,
              amm2SpotPrices24HoursAgo,
            );
          }
        }
      }

      let outcome = IOCategoricalAssetId.is(assetId)
        ? (market.categories?.[getIndexOf(assetId)]?.name ??
          JSON.stringify(assetId.CategoricalOutcome))
        : IOScalarAssetId.is(assetId)
          ? getIndexOf(assetId) == 1
            ? "Short"
            : "Long"
          : "unknown";

      let color = IOScalarAssetId.is(assetId)
        ? (market.categories?.[getIndexOf(assetId)]?.color ?? "#ffffff")
        : IOScalarAssetId.is(assetId)
          ? getIndexOf(assetId) == 1
            ? "rgb(255, 0, 0)"
            : "rgb(36, 255, 0)"
          : "unknown";

      if (IOPoolShareAssetId.is(assetId)) {
        outcome = "Pool Share";
        color = "#DF0076";
      }

      const avgCost = tradeHistory
        ?.filter((transaction) => transaction !== undefined)
        ?.filter((transaction) => transaction.marketId === marketId)
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
              transaction.marketId === marketId &&
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
            transaction.marketId === marketId &&
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

      positionsData.push({
        assetId,
        market,
        pool,
        price,
        avgCost,
        upnl: calculateUnrealizedPnL(tradeHistory, avgCost, price.toNumber()),
        rpnl: calculateFifoPnl(tradeHistory),
        price24HoursAgo,
        outcome,
        color,
        userBalance,
        changePercentage: change,
        totalIssuance,
      });
    }

    return positionsData;
  }, [
    rawPositions,
    oldSwapPools,
    markets,
    ztgPrice,
    oldSwapPoolsTotalIssuance,
    userAssetBalances,
    isTradeHistoryLoading,
  ]);

  const marketPositions = useMemo<
    Position<CategoricalAssetId | ScalarAssetId>[] | null
  >(
    () =>
      positions?.filter(
        (position): position is Position<CategoricalAssetId | ScalarAssetId> =>
          IOMarketOutcomeAssetId.is(position.assetId),
      ) ?? null,
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
    const assetId = parseAssetId(position.market.baseAsset).unwrap();

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
