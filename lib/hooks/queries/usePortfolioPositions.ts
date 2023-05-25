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
} from "@zeitgeistpm/sdk-next";
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
import { useTransactionHistory } from "./useTransactionHistory";
import { useTradeHistory } from "./useTradeHistory";
import {
  ForeignAssetPrices,
  useAllForeignAssetUsdPrices,
} from "./useAssetUsdPrice";
import { transaction } from "mobx";

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
   * The pool related to the position.
   */
  pool: IndexedPool<Context>;
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
  avgPrice: number;
  /**
   * The average cost of acquiring the position of the asset.
   */
  pnl: number;
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
  totalIssuance: Decimal;
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
  usdZtgPrice: Decimal;
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
  const block24HoursAgo = Math.floor(now?.block - 7200);
  const { data: marketBonds, isLoading: isBondsLoading } =
    useAccountBonds(address);
  const { data: foreignAssetPrices } = useAllForeignAssetUsdPrices();

  const { data: tradeHistory, isLoading: isTradeHistoryLoading } =
    useTradeHistory(address);

  const rawPositions = useAccountTokenPositions({
    where: {
      account: {
        accountId_eq: address,
      },
      balance_gt: 0,
    },
  });

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
    let positionsData: Position[] = [];

    if (!rawPositions.data || !pools.data || !markets.data) {
      return null;
    }

    const calculatePrice = (
      pool: IndexedPool<Context>,
      assetId: AssetId,
      poolsZtgBalances: PoolZtgBalanceLookup,
      poolAssetBalances: UseAccountAssetBalances,
    ): null | Decimal => {
      const poolZtgBalance = poolsZtgBalances[pool.poolId]?.toNumber();

      if (typeof poolZtgBalance === "undefined") {
        return null;
      }

      const poolAssetBalance = poolAssetBalances.get(
        poolAccountIds[pool.poolId],
        assetId,
      )?.data.balance;

      if (!poolAssetBalance) return null;

      const ztgWeight = new Decimal(pool.totalWeight).div(2);
      const assetWeight = getAssetWeight(pool, assetId).unwrap();

      return calcSpotPrice(
        poolZtgBalance,
        ztgWeight,
        poolAssetBalance.free.toNumber(),
        assetWeight,
        0,
      );
    };

    if (!rawPositions.data) return null;

    let stillLoading = false;

    for (const position of rawPositions.data) {
      const assetId = parseAssetId(position.assetId).unwrap();

      let pool: IndexedPool<Context>;
      let marketId: number;
      let market: FullMarketFragment;

      if (IOZtgAssetId.is(assetId) || IOForeignAssetId.is(assetId)) {
        continue;
      }

      if (IOPoolShareAssetId.is(assetId)) {
        pool = pools.data.find((pool) => pool.poolId === assetId.PoolShare);
        marketId = pool.marketId;
        market = markets.data?.find((m) => m.marketId === marketId);
      }

      if (IOMarketOutcomeAssetId.is(assetId)) {
        marketId = getMarketIdOf(assetId);
        market = markets.data?.find((m) => m.marketId === marketId);
        pool = pools.data.find((pool) => pool.marketId === marketId);
      }

      if (!market || !pool) {
        stillLoading = true;
        continue;
      }

      const balance = userAssetBalances.get(address, assetId)?.data.balance;
      const totalIssuanceForPoolQuery = poolsTotalIssuance[pool.poolId];
      const totalIssuanceData = poolsTotalIssuance[pool.poolId]?.data;
      if (!balance || !totalIssuanceForPoolQuery.data || !totalIssuanceData) {
        stillLoading = true;
        continue;
      }

      const userBalance = new Decimal(balance.free.toNumber());

      const totalIssuance = new Decimal(
        totalIssuanceForPoolQuery.data.totalIssuance.toString(),
      );

      let price: Decimal;
      let price24HoursAgo: Decimal;

      if (IOMarketOutcomeAssetId.is(assetId)) {
        if (market.status === "Resolved") {
          price = calcResolvedMarketPrices(market).get(getIndexOf(assetId));
          price24HoursAgo = price;
        } else {
          price = calculatePrice(
            pool,
            assetId,
            poolsZtgBalances,
            poolAssetBalances,
          );

          price24HoursAgo = calculatePrice(
            pool,
            assetId,
            poolsZtgBalances24HoursAgo,
            poolAssetBalances24HoursAgo,
          );
        }
      } else if (IOPoolShareAssetId.is(assetId)) {
        const poolAssetIds = pool.weights
          .map((w) => parseAssetId(w.assetId).unwrap())
          .filter(IOMarketOutcomeAssetId.is.bind(IOMarketOutcomeAssetId));

        const poolTotalValue = poolAssetIds.reduce(
          (acc, assetId) => {
            const balance = poolAssetBalances.get(
              poolAccountIds[pool.poolId],
              assetId,
            )?.data?.balance;

            if (!balance) return;

            const price = calculatePrice(
              pool,
              assetId,
              poolsZtgBalances,
              poolAssetBalances,
            );

            const price24HoursAgo = calculatePrice(
              pool,
              assetId,
              poolsZtgBalances24HoursAgo,
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

        if (!poolTotalValue) {
          stillLoading = true;
          continue;
        }

        const totalIssuance = new Decimal(
          totalIssuanceData.totalIssuance.toString(),
        );

        price = poolTotalValue.total.div(totalIssuance);
        price24HoursAgo = poolTotalValue.total24HoursAgo.div(totalIssuance);
      }

      if (!price || !price24HoursAgo) {
        stillLoading = true;
        continue;
      }

      let outcome: string;
      let color: string;

      if (IOMarketOutcomeAssetId.is(assetId)) {
        const assetIndex = getIndexOf(assetId);

        outcome = market.marketType.categorical
          ? market.categories[assetIndex].name
          : assetIndex == 1
          ? "Short"
          : "Long";
        color = market.marketType.categorical
          ? market.categories[assetIndex].color ?? "#ffffff"
          : assetIndex == 1
          ? "rgb(255, 0, 0)"
          : "rgb(36, 255, 0)";
      }

      if (IOPoolShareAssetId.is(assetId)) {
        outcome = "Pool Share";
        color = "#DF0076";
      }

      if (isTradeHistoryLoading) {
        stillLoading = true;
        continue;
      }

      const avgPrice = tradeHistory
        .filter((transaction) => transaction.marketId === marketId)
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

      const calculateFifoPnl = (transactions) => {
        let buys = [];
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

      const change = diffChange(price, price24HoursAgo);

      positionsData.push({
        assetId,
        market,
        pool,
        price,
        avgPrice,
        pnl: calculateFifoPnl(tradeHistory),
        price24HoursAgo,
        outcome,
        color,
        userBalance,
        changePercentage: change,
        totalIssuance,
      });
    }

    if (stillLoading) return null;

    return positionsData;
  }, [
    rawPositions.data,
    pools.data,
    markets.data,
    ztgPrice,
    poolsTotalIssuance,
    userAssetBalances,
    poolsZtgBalances,
    poolAssetBalances,
    poolsZtgBalances24HoursAgo,
    poolAssetBalances24HoursAgo,
  ]);

  const marketPositions = useMemo<
    Position<CategoricalAssetId | ScalarAssetId>[]
  >(
    () =>
      positions?.filter(
        (position): position is Position<CategoricalAssetId | ScalarAssetId> =>
          IOMarketOutcomeAssetId.is(position.assetId),
      ),
    [positions],
  );

  const subsidyPositions = useMemo<Position<PoolShareAssetId>[]>(
    () =>
      positions?.filter((position): position is Position<PoolShareAssetId> =>
        IOPoolShareAssetId.is(position.assetId),
      ),
    [positions],
  );

  const breakdown = useMemo<PorfolioBreakdown>(() => {
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
      marketBonds?.length > 0
        ? calcTotalBondsValue(marketBonds, foreignAssetPrices, ztgPrice)
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
    all: positions,
    markets: marketPositions,
    subsidy: subsidyPositions,
    breakdown,
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
    const value = position.userBalance.mul(position[key]).mul(priceMultiplier);
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
  const priceDiff = a.minus(b);
  const priceChange = priceDiff.div(b);
  return priceChange.mul(100).toNumber();
};

const calcTotalBondsValue = (
  marketBonds: MarketBond[],
  foreignAssetPrices: ForeignAssetPrices,
  ztgPrice: Decimal,
) => {
  const bondTotal = marketBonds?.reduce((total, marketBond) => {
    const assetId = parseAssetId(marketBond.baseAsset).unwrap();
    const priceMultiplier = IOForeignAssetId.is(assetId)
      ? foreignAssetPrices[assetId.ForeignAsset.toString()]?.div(ztgPrice)
      : 1;

    const creationBond = marketBond.bonds.creation;
    if (creationBond.isSettled === false) {
      total = total.plus(creationBond.value).mul(priceMultiplier);
    }

    const oracleBond = marketBond.bonds.oracle;
    if (oracleBond.isSettled === false) {
      total = total.plus(oracleBond.value).mul(priceMultiplier);
    }

    return total;
  }, new Decimal(0));

  return bondTotal;
};
