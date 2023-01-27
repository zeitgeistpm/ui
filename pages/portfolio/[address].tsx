import { Tab } from "@headlessui/react";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  AssetId,
  CategoricalAssetId,
  Context,
  fromCompositeIndexerAssetId,
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
  IndexedPool,
  IOMarketOutcomeAssetId,
  IOPoolShareAssetId,
  IOZtgAssetId,
  isNA,
  PoolShareAssetId,
  ScalarAssetId,
  ZTG,
} from "@zeitgeistpm/sdk-next";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import {
  PortfolioBreakdown,
  PortfolioBreakdownProps,
} from "components/portfolio/Breakdown";
import {
  MarketPositions,
  MarketPositionsSkeleton,
} from "components/portfolio/MarketPositions";
import InfoBoxes from "components/ui/InfoBoxes";
import Decimal from "decimal.js";
import { DAY_SECONDS } from "lib/constants";
import {
  UseAccountAssetBalances,
  useAccountAssetBalances,
} from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountTokenPositions } from "lib/hooks/queries/useAccountTokenPositions";
import { useChainTimeNow } from "lib/hooks/queries/useChainTime";
import { useMarketsByIds } from "lib/hooks/queries/useMarketsByIds";
import { usePoolAccountIds } from "lib/hooks/queries/usePoolAccountIds";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import {
  PoolZtgBalanceLookup,
  usePoolZtgBalance,
} from "lib/hooks/queries/usePoolZtgBalance";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useZtgInfo } from "lib/hooks/queries/useZtgInfo";
import { calcSpotPrice } from "lib/math";
import { useStore } from "lib/stores/Store";
import { groupBy, range } from "lodash-es";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

type PositionData<T extends AssetId = AssetId> = {
  assetId: T;
  marketId: number;
  market: FullMarketFragment;
  pool: IndexedPool<Context>;
  outcome: string;
  price24HoursAgo: Decimal;
  price: Decimal;
  userBalance: Decimal;
  totalIssuance: Decimal;
  change: number;
};

const Portfolio: NextPage = observer(() => {
  const { config, blockNumber } = useStore();
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  const { data: now } = useChainTimeNow();

  const { data: ztgPrice } = useZtgInfo();
  const block24HoursAgo = Math.floor(now?.block - 86400 / now?.period);

  const positions = useAccountTokenPositions(address);

  const filter = positions.data
    ?.map((position) => {
      const assetId = fromCompositeIndexerAssetId(position.assetId).unwrap();
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

  const poolsZtgBalances = usePoolZtgBalance(pools.data ?? []);

  const poolsTotalIssuance = useTotalIssuanceForPools(
    pools.data?.map((p) => p.poolId) ?? [],
  );

  const poolsZtgBalances24HoursAgo = usePoolZtgBalance(
    pools.data ?? [],
    block24HoursAgo,
    { enabled: Boolean(now?.block) },
  );

  const poolAssetBalancesFilter =
    positions.data
      ?.map((position) => {
        const assetId = fromCompositeIndexerAssetId(position.assetId).unwrap();
        const pool = pools.data?.find((pool) => {
          if (IOPoolShareAssetId.is(assetId)) {
            return pool.poolId === assetId.PoolShare;
          }
          if (IOMarketOutcomeAssetId.is(assetId)) {
            return pool.marketId === getMarketIdOf(assetId);
          }
        });
        if (!pool) return null;
        return {
          account: poolAccountIds[pool.poolId],
          assetId,
        };
      })
      .filter(isNotNull) ?? [];

  const poolAssetBalances = useAccountAssetBalances(poolAssetBalancesFilter);

  const poolAssetBalances24HoursAgo = useAccountAssetBalances(
    poolAssetBalancesFilter,
    block24HoursAgo,
    { enabled: Boolean(now?.block) },
  );

  const userAssetBalances = useAccountAssetBalances(
    positions.data?.map((position) => ({
      assetId: fromCompositeIndexerAssetId(position.assetId).unwrap(),
      account: address,
    })) ?? [],
  );

  const positionsData = useMemo<PositionData[] | null>(() => {
    let positionsData: PositionData[] = [];

    if (!positions.data || !pools.data || !markets.data) {
      return null;
    }

    const calculatePrice = (
      pool: IndexedPool<Context>,
      assetId: AssetId,
      poolsZtgBalances: PoolZtgBalanceLookup,
      poolAssetBalances: UseAccountAssetBalances,
    ): null | Decimal => {
      const poolZtgBalance = poolsZtgBalances[pool.poolId]?.free.toNumber();

      if (!poolZtgBalance) {
        return null;
      }

      const poolAssetBalance = poolAssetBalances.get(
        poolAccountIds[pool.poolId],
        assetId,
      )?.data.balance;

      if (!poolAssetBalance || isNA(poolAssetBalance)) return null;

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

    if (!positions.data) return null;

    let stillLoading = false;

    positions.data.forEach((position) => {
      const assetId = fromCompositeIndexerAssetId(position.assetId).unwrap();

      let pool: IndexedPool<Context>;
      let marketId: number;
      let market: FullMarketFragment;

      if (IOZtgAssetId.is(assetId)) {
        return;
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
        console.log("market / pool is NA", assetId);
        stillLoading = true;
        return;
      }

      const totalIssuanceForPoolQuery = poolsTotalIssuance[pool.poolId];

      if (!totalIssuanceForPoolQuery.data) {
        stillLoading = true;
        return;
      }

      const totalIssuance = new Decimal(
        totalIssuanceForPoolQuery.data.totalIssuance.toString(),
      );

      let price: Decimal;
      let price24HoursAgo: Decimal;

      if (IOMarketOutcomeAssetId.is(assetId)) {
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

      if (IOPoolShareAssetId.is(assetId)) {
        price = new Decimal(ZTG);
        price24HoursAgo = new Decimal(ZTG);
      }

      if (!price || !price24HoursAgo) {
        console.log("price is NA");
        stillLoading = true;
        return;
      }

      const assetIndex = getIndexOf(assetId);

      let outcome: string;

      if (IOMarketOutcomeAssetId.is(assetId)) {
        outcome = market.marketType.categorical
          ? market.categories[assetIndex].name
          : assetIndex == 1
          ? "Short"
          : "Long";
      }

      if (IOPoolShareAssetId.is(assetId)) {
        outcome = "Pool Share";
      }

      const balance = userAssetBalances.get(address, assetId)?.data.balance;

      if (!balance || isNA(balance)) {
        console.log("balance is NA");
        stillLoading = true;
        return;
      }

      const userBalance = new Decimal(balance.free.toNumber());
      const change = diffChange(price, price24HoursAgo);

      positionsData.push({
        assetId,
        marketId,
        market,
        pool,
        price,
        price24HoursAgo,
        outcome,
        userBalance,
        change,
        totalIssuance,
      });
    });

    if (stillLoading) return null;

    return positionsData;
  }, [
    positions.data,
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
    PositionData<CategoricalAssetId | ScalarAssetId>[]
  >(() => {
    if (positionsData) {
      return positionsData.filter(
        (
          position,
        ): position is PositionData<CategoricalAssetId | ScalarAssetId> =>
          IOMarketOutcomeAssetId.is(position.assetId),
      );
    }
    return null;
  }, [positionsData]);

  const subsidyPositions = useMemo<PositionData<PoolShareAssetId>[]>(() => {
    if (positionsData) {
      return positionsData.filter(
        (position): position is PositionData<PoolShareAssetId> =>
          IOPoolShareAssetId.is(position.assetId),
      );
    }
    return [];
  }, [positionsData]);

  const marketPositionsByMarket = useMemo(() => {
    if (marketPositions) {
      return groupBy(marketPositions, (position) => position.marketId);
    }
    return null;
  }, [marketPositions]);

  const breakdown = useMemo<PortfolioBreakdownProps>(() => {
    if (!marketPositions || !ztgPrice) {
      return { loading: true };
    }

    const tradingPositionsTotal = marketPositions.reduce((acc, position) => {
      if (position.userBalance.isNaN() || position.price.isNaN()) {
        return acc;
      }
      const value = position.userBalance.mul(position.price);
      return !value.isNaN() ? acc.plus(value) : acc;
    }, new Decimal(0));

    const tradingPositionsTotal24HoursAgo = marketPositions.reduce(
      (acc, position) => {
        if (position.userBalance.isNaN() || position.price24HoursAgo.isNaN()) {
          return acc;
        }
        const value = position.userBalance.mul(position.price24HoursAgo);
        return !value.isNaN() ? acc.plus(value) : acc;
      },
      new Decimal(0),
    );

    const tradingPositionsChange = diffChange(
      tradingPositionsTotal,
      tradingPositionsTotal24HoursAgo,
    );

    // TODO: load subsidy positions data
    const subsidyPositionsTotal = new Decimal(10).mul(ZTG);
    const subsidyPositionsTotal24HoursAgo = new Decimal(10).mul(ZTG);

    const subsidyPositionsChange = diffChange(
      subsidyPositionsTotal,
      subsidyPositionsTotal24HoursAgo,
    );

    const positionsTotal = tradingPositionsTotal.plus(subsidyPositionsTotal);
    const positionsTotal24HoursAgo = tradingPositionsTotal24HoursAgo.plus(
      subsidyPositionsTotal24HoursAgo,
    );

    const totalChange = diffChange(positionsTotal, positionsTotal24HoursAgo);

    return {
      usdZtgPrice: ztgPrice.price,
      total: {
        value: positionsTotal,
        changePercentage: totalChange,
      },
      tradingPositions: {
        value: tradingPositionsTotal,
        changePercentage: tradingPositionsChange,
      },
      subsidy: {
        value: subsidyPositionsTotal,
        changePercentage: subsidyPositionsChange,
      },
      bonded: {
        value: new Decimal(234422344),
        changePercentage: 30,
      },
    };
  }, [ztgPrice, marketPositions]);

  return (
    <>
      <InfoBoxes />

      <h2 className="header text-xs font-bold mb-8">Portfolio</h2>

      <div className="mb-12">
        <h3 className="font-bold text-xl mb-4">Breakdown</h3>
        <PortfolioBreakdown {...breakdown} />
      </div>

      <div>
        <h3 className="text-3xl mb-6 text-center">Predictions</h3>
        <Tab.Group>
          <Tab.List className="flex center mb-14">
            <Tab className="text-lg px-4 ui-selected:font-bold ui-selected:text-gray-800 text-gray-500 transition-all">
              By Markets
            </Tab>
            <Tab className="text-lg px-4 ui-selected:font-bold ui-selected:text-gray-800 text-gray-500 transition-all">
              Subsidy
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              {!marketPositionsByMarket
                ? range(0, 8).map((i) => (
                    <MarketPositionsSkeleton className="mb-14" key={i} />
                  ))
                : Object.values(marketPositionsByMarket).map(
                    (marketPositions) => {
                      const market = marketPositions[0].market;
                      return (
                        <MarketPositions
                          className="mb-14"
                          title={market.question}
                          usdZtgPrice={ztgPrice.price}
                          positions={marketPositions.map((position) => ({
                            outcome: position.outcome,
                            price: position.price,
                            balance: position.userBalance,
                            dailyChangePercentage: position.change,
                          }))}
                        />
                      );
                    },
                  )}
            </Tab.Panel>
            <Tab.Panel>Content 3</Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
  );
});

const diffChange = (a: Decimal, b: Decimal) => {
  return new Decimal(100)
    .mul(a.minus(b).div(a.plus(b).div(2)).abs())
    .toNumber();
};

export default Portfolio;
