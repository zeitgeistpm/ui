import { Tab } from "@headlessui/react";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  AssetId,
  CategoricalAssetId,
  Context,
  fromCompositeIndexerAssetId,
  getMarketIdOf,
  IndexedPool,
  PoolShareAssetId,
  ScalarAssetId,
  ZTG,
} from "@zeitgeistpm/sdk-next";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import {
  PortfolioBreakdown,
  PortfolioBreakdownProps,
} from "components/portfolio/Breakdown";
import { MarketPositions } from "components/portfolio/MarketPositions";
import InfoBoxes from "components/ui/InfoBoxes";
import Decimal from "decimal.js";
import { DAY_SECONDS } from "lib/constants";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountTokenPositions } from "lib/hooks/queries/useAccountTokenPositions";
import { useChainTimeNow } from "lib/hooks/queries/useChainTime";
import { useMarketsByIds } from "lib/hooks/queries/useMarketsByIds";
import { usePoolAccountIds } from "lib/hooks/queries/usePoolAccountIds";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import { usePoolZtgBalance } from "lib/hooks/queries/usePoolZtgBalance";
import { useZtgInfo } from "lib/hooks/queries/useZtgInfo";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

const Portfolio: NextPage = observer(() => {
  const store = useStore();
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  const { data: now } = useChainTimeNow();

  const { data: ztgPrice } = useZtgInfo();
  const positions = useAccountTokenPositions(address);

  const filter = positions.data
    ?.map((position) => {
      const assetId = fromCompositeIndexerAssetId(position.assetId).unwrap();
      if ("CategoricalOutcome" in assetId || "ScalarOutcome" in assetId) {
        return {
          marketId: getMarketIdOf(assetId),
        };
      }
      if ("PoolShare" in assetId) {
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

  const poolAssetBalances = useAccountAssetBalances(
    positions.data
      ?.map((position) => {
        const assetId = fromCompositeIndexerAssetId(position.assetId).unwrap();
        const pool = pools.data?.find((pool) => {
          if ("PoolShare" in assetId) {
            return pool.poolId === assetId.PoolShare;
          }
          if ("CategoricalOutcome" in assetId || "ScalarOutcome" in assetId) {
            return pool.marketId === getMarketIdOf(assetId);
          }
        });
        if (!pool) return null;
        return {
          account: poolAccountIds[pool.poolId],
          assetId,
        };
      })
      .filter(isNotNull) ?? [],
  );

  const userAssetBalances = useAccountAssetBalances(
    positions.data?.map((position) => ({
      assetId: fromCompositeIndexerAssetId(position.assetId).unwrap(),
      account: address,
    })) ?? [],
  );

  type PositionData<T extends AssetId> = {
    assetId: T;
    marketId: number;
    market: FullMarketFragment;
    pool: IndexedPool<Context>;
    assetPrice: Decimal;
  };

  const { marketPositions, subsidyPositions } = useMemo(() => {
    let marketPositions: PositionData<ScalarAssetId | CategoricalAssetId>[] =
      [];
    let subsidyPositions: PositionData<PoolShareAssetId>[] = [];

    if (positions.data && pools.data && markets.data) {
      positions.data?.forEach((position) => {
        const assetId = fromCompositeIndexerAssetId(position.assetId).unwrap();
        if ("CategoricalOutcome" in assetId || "ScalarOutcome" in assetId) {
          const marketId = getMarketIdOf(assetId);
          const market = markets.data?.find((m) => m.marketId === marketId);
          const pool = pools.data.find((pool) => pool.marketId === marketId);
          marketPositions.push({
            assetId,
            marketId,
            market,
            pool,
            assetPrice: new Decimal(ZTG), // mock
          });
        }
        if ("PoolShare" in assetId) {
          const pool = pools.data.find(
            (pool) => pool.poolId === assetId.PoolShare,
          );
          const marketId = pool.marketId;
          const market = markets.data?.find((m) => m.marketId === marketId);
          subsidyPositions.push({
            assetId,
            marketId,
            market,
            pool,
            assetPrice: new Decimal(ZTG), // mock
          });
        }
      });
    }

    return {
      marketPositions,
      subsidyPositions,
    };
  }, [positions.data, pools.data, markets.data]);

  // const assetPricesHistoryLookup = useAssetsPriceHistory(
  //   accountTokenPositions.data?.map(({ asset }) => asset),
  //   {
  //     startTimeStamp: dateOneWeekAgo,
  //   },
  // );

  /**
   * for trading positions and subsidy
   *  lookup accountBalances, filter by accountId
   *  group by assetId is subsidy or trading related clientside
   *    for trading and subsidy respectively
   *      get assetId
   *      fetch price and ballance from rpc
   */

  const breakdown = useMemo<PortfolioBreakdownProps>(() => {
    if (ztgPrice) {
      return {
        usdZtgPrice: ztgPrice.price,
        total: {
          value: new Decimal(1238147473712737),
          changePercentage: 12,
        },
        tradingPositions: {
          value: new Decimal(489384787458),
          changePercentage: -32,
        },
        subsidy: {
          value: new Decimal(9459388294948958),
          changePercentage: 12,
        },
        bonded: {
          value: new Decimal(234422344),
          changePercentage: 30,
        },
      };
    }

    return { loading: true };
  }, [ztgPrice]);

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
              <MarketPositions
                className="mb-14"
                title="Who will win the 2022 Men's T20 Cricket World Cup?"
                usdZtgPrice={new Decimal(0.1)}
                positions={[
                  {
                    outcome: "Morocco",
                    balance: new Decimal(82746729345743),
                    price: new Decimal(2.4),
                    dailyChangePercentage: 12,
                  },
                  {
                    outcome: "Zimbabwe",
                    balance: new Decimal(123431233423),
                    price: new Decimal(1.1),
                    dailyChangePercentage: -5,
                  },
                ]}
              />
            </Tab.Panel>
            <Tab.Panel>Content 3</Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* <div className="-ml-ztg-22 mb-ztg-30">
            <div className="flex justify-end -mt-ztg-30">
              <TimeFilters value={timeFilter} onClick={handleTimeFilterClick} />
            </div>
            <TimeSeriesChart
              data={chartData}
              series={[{ accessor: "v", label: "Price" }]}
              yUnits={store.config.tokenSymbol}
            />
          </div>
          <RedeemAllButton
            marketStores={positions.map((p) => p.marketStore)}
            onSuccess={() => incrementUpdateNum()}
          />
          <div className="mb-ztg-50  ">
            {positions.map((position, index) => (
              <PortfolioCard key={index} position={position} />
            ))}
          </div> */}
    </>
  );
});

const dateOneWeekAgo = new Date(
  new Date().getTime() - DAY_SECONDS * 28 * 1000,
).toISOString();

export default Portfolio;
