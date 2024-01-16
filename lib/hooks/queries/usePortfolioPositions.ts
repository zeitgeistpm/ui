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
import {
  UseAccountAssetBalances,
  useAccountAssetBalances,
} from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountTokenPositions } from "lib/hooks/queries/useAccountTokenPositions";
import { useMarketsByIds } from "lib/hooks/queries/useMarketsByIds";
import { usePoolAccountIds } from "lib/hooks/queries/usePoolAccountIds";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import {
  PoolZtgBalanceLookup,
  usePoolBaseBalances,
} from "lib/hooks/queries/usePoolBaseBalances";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { calcSpotPrice } from "lib/math";
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
} from "./useAmm2MarketSpotPrices";
import { formatNumberLocalized } from "lib/util";

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

  const filter = rawPositions.data
    ?.map((position) => {
      const assetId = parseAssetId(position.assetId).unwrap();
      if (IOMarketOutcomeAssetId.is(assetId)) {
        return {
          marketId: getMarketIdOf(assetId),
        };
      }
      if (IOPoolShareAssetId.is(assetId)) {
        return {
          poolId: assetId.PoolShare,
        };
      }
      return null;
    })
    .filter(isNotNull);

  const pools = usePoolsByIds(filter);
  const markets = useMarketsByIds(filter);
  const amm2MarketIds = markets.data
    ?.filter((market) => market.scoringRule === ScoringRule.Lmsr)
    .map((m) => m.marketId);

  const { data: amm2SpotPrices } = useAmm2MarketSpotPrices(amm2MarketIds);

  const { data: amm2SpotPrices24HoursAgo } = useAmm2MarketSpotPrices(
    amm2MarketIds,
    block24HoursAgo,
  );

  const poolAccountIds = usePoolAccountIds(pools.data);

  const poolsZtgBalances = usePoolBaseBalances(pools.data ?? []);

  const poolsTotalIssuance = useTotalIssuanceForPools(
    pools.data?.map((p) => p.poolId) ?? [],
  );

  const poolsZtgBalances24HoursAgo = usePoolBaseBalances(
    pools.data ?? [],
    block24HoursAgo,
    { enabled: Boolean(now?.block) },
  );

  const poolAssetBalancesFilter =
    rawPositions.data
      ?.flatMap((position) => {
        const assetId = parseAssetId(position.assetId).unwrap();
        const pool = pools.data?.find((pool) => {
          if (IOPoolShareAssetId.is(assetId)) {
            return pool.poolId === assetId.PoolShare;
          }
          if (IOMarketOutcomeAssetId.is(assetId)) {
            return pool.marketId === getMarketIdOf(assetId);
          }
        });

        if (!pool) return null;

        const assetIds = pool.weights
          .map((w) => parseAssetId(w.assetId).unwrap())
          .filter(IOMarketOutcomeAssetId.is.bind(IOMarketOutcomeAssetId));

        return assetIds.map((assetId) => ({
          assetId,
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
      assetId: parseAssetId(position.assetId).unwrap(),
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
      poolsZtgBalances.isLoading ||
      !poolsTotalIssuance ||
      userAssetBalances.isLoading ||
      poolsZtgBalances24HoursAgo.isLoading ||
      poolAssetBalances24HoursAgo.isLoading ||
      isTradeHistoryLoading;

    if (stillLoading) {
      return null;
    }

    let positionsData: Position[] = [];

    const calculatePrice = (
      pool: IndexedPool<Context>,
      assetId: AssetId,
      poolsZtgBalances: PoolZtgBalanceLookup,
      poolAssetBalances: UseAccountAssetBalances,
    ): null | Decimal => {
      const poolZtgBalance = poolsZtgBalances[pool.poolId]?.toNumber();

      const ztgWeight = new Decimal(pool.totalWeight ?? 0).div(2);
      const assetWeight = getAssetWeight(pool, assetId).unwrap();

      const poolAssetBalance = poolAssetBalances?.get(
        poolAccountIds?.[pool.poolId],
        assetId,
      )?.data?.balance;

      if (!poolAssetBalance || !ztgWeight || !assetWeight) return null;

      return calcSpotPrice(
        poolZtgBalance,
        ztgWeight,
        poolAssetBalance.free.toNumber(),
        assetWeight,
        0,
      );
    };

    for (const position of rawPositions?.data ?? []) {
      const assetId = parseAssetId(position.assetId).unwrap();

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
        marketId = getMarketIdOf(assetId);
        market = markets.data?.find((m) => m.marketId === marketId);
        pool = pools.data?.find((pool) => pool.marketId === marketId);
      }

      if (!market) {
        continue;
      }

      const balance = address
        ? userAssetBalances?.get(address, assetId)?.data?.balance
        : undefined;
      const totalIssuanceForPoolQuery = pool && poolsTotalIssuance[pool.poolId];
      const totalIssuanceData = pool && poolsTotalIssuance[pool.poolId]?.data;

      const userBalance = new Decimal(balance?.free.toNumber() ?? 0);

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
          if (market.scoringRule === ScoringRule.Cpmm && pool) {
            price =
              calculatePrice(
                pool,
                assetId,
                poolsZtgBalances.data,
                poolAssetBalances,
              ) ?? undefined;

            price24HoursAgo =
              calculatePrice(
                pool,
                assetId,
                poolsZtgBalances24HoursAgo.data,
                poolAssetBalances24HoursAgo,
              ) ?? undefined;
          } else if (market.scoringRule === ScoringRule.Lmsr) {
            price = lookupAssetPrice(assetId, amm2SpotPrices);

            price24HoursAgo = lookupAssetPrice(
              assetId,
              amm2SpotPrices24HoursAgo,
            );
          }
        }
      } else if (IOPoolShareAssetId.is(assetId) && pool) {
        const poolAssetIds = pool.weights
          .map((w) => parseAssetId(w.assetId).unwrap())
          .filter(IOMarketOutcomeAssetId.is.bind(IOMarketOutcomeAssetId));

        const poolTotalValue = poolAssetIds.reduce(
          (acc, assetId) => {
            if (!pool) {
              return acc;
            }

            const balance = poolAssetBalances.get(
              poolAccountIds[pool.poolId],
              assetId,
            )?.data?.balance;

            if (!balance) return;

            const price = calculatePrice(
              pool,
              assetId,
              poolsZtgBalances.data,
              poolAssetBalances,
            );

            const price24HoursAgo = calculatePrice(
              pool,
              assetId,
              poolsZtgBalances24HoursAgo.data,
              poolAssetBalances24HoursAgo,
            );

            if (!price || !price24HoursAgo) {
              return acc;
            }

            return {
              total: acc.total.add(price.mul(balance.free.toNumber())),
              total24HoursAgo: acc.total24HoursAgo.add(
                price24HoursAgo.mul(balance.free.toNumber()),
              ),
            };
          },
          {
            total: new Decimal(0),
            total24HoursAgo: new Decimal(0),
          },
        );

        const totalIssuance = new Decimal(
          totalIssuanceData?.totalIssuance.toString() ?? 0,
        );

        price = new Decimal(poolTotalValue?.total.div(totalIssuance) ?? 0);
        price24HoursAgo = new Decimal(
          poolTotalValue?.total24HoursAgo.div(totalIssuance) ?? 0,
        );
      }

      let outcome = IOCategoricalAssetId.is(assetId)
        ? market.categories?.[getIndexOf(assetId)]?.name ??
          JSON.stringify(assetId.CategoricalOutcome)
        : IOScalarAssetId.is(assetId)
          ? getIndexOf(assetId) == 1
            ? "Short"
            : "Long"
          : "unknown";

      let color = IOScalarAssetId.is(assetId)
        ? market.categories?.[getIndexOf(assetId)]?.color ?? "#ffffff"
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
    pools,
    markets,
    ztgPrice,
    poolsTotalIssuance,
    userAssetBalances,
    poolsZtgBalances,
    poolAssetBalances,
    poolsZtgBalances24HoursAgo,
    poolAssetBalances24HoursAgo,
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
