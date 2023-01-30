import {
  getIndexOf,
  getMarketIdOf,
  projectEndTimestamp,
} from "@zeitgeistpm/sdk-next";
import PortfolioCard, { Position } from "components/account/PortfolioCard";
import AssetActionButtons from "components/assets/AssetActionButtons";
import InfoBoxes from "components/ui/InfoBoxes";
import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, { ChartData } from "components/ui/TimeSeriesChart";
import Decimal from "decimal.js";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { useObservable } from "lib/hooks";
import { useAccountBalanceHistory } from "lib/hooks/queries/useAccountBalanceHistory";
import { useAccountTokenPositions } from "lib/hooks/queries/useAccountTokenPositions";
import { useAssetsPriceHistory } from "lib/hooks/queries/useAssetsPriceHistory";
import { useChainTimeNow } from "lib/hooks/queries/useChainTime";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useMarketsStore } from "lib/stores/MarketsStore";
import { usePoolsStore } from "lib/stores/PoolsStore";
import { useStore } from "lib/stores/Store";
import { formatBal, isValidPolkadotAddress } from "lib/util";
import { calcScalarResolvedPrices } from "lib/util/calc-scalar-winnings";
import { get24HrPriceChange, PricePoint } from "lib/util/market";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { concatWith, from } from "rxjs";

const Portfolio: NextPage = observer(() => {
  const [sdk, id] = useSdkv2();
  const store = useStore();
  const marketsStore = useMarketsStore();
  const poolStore = usePoolsStore();
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  const [positions, setPositions] = useState<Position[]>([]);
  const [message, setMessage] = useState<string>();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(
    filters.find((f) => f.label === "All"),
  );
  const [updateNum, setUpdateNum] = useState(0);

  const incrementUpdateNum = () => {
    setUpdateNum((prev) => {
      return prev + 1;
    });
  };

  useObservable(
    from([]).pipe(concatWith(marketsStore.marketChanges$)),
    () => {
      incrementUpdateNum();
    },
    [],
    500,
  );

  const { data: now } = useChainTimeNow();

  const balanceHistory = useAccountBalanceHistory(address, timeFilter);
  const accountTokenPositions = useAccountTokenPositions(address);

  const pools = usePoolsByIds(
    accountTokenPositions.data?.map(({ asset }) => ({
      marketId: getMarketIdOf(asset),
    })),
  );

  const saturatedPoolsIndex = useSaturatedPoolsIndex(pools?.data);

  const assetPricesHistoryLookup = useAssetsPriceHistory(
    accountTokenPositions.data?.map(({ asset }) => asset),
    {
      startTimeStamp: dateOneWeekAgo,
    },
  );

  const chartData = useMemo<ChartData[]>(() => {
    if (balanceHistory?.data) {
      let chartData = balanceHistory.data.map((val) => ({
        v: val.pvalue / ZTG,
        t: new Date(val.timestamp).getTime(),
      }));

      if (chartData.length > 0) {
        chartData.unshift({
          v: chartData[0].v,
          t: new Date().getTime(),
        });
      }

      return chartData;
    }
    return [];
  }, [balanceHistory.data]);

  useEffect(() => {
    if (!address) {
      setMessage("Wallet not connected");
      return;
    }

    if (isValidPolkadotAddress(address) === false) {
      setMessage("Invalid address");
      return;
    }
    if (updateNum === 0) {
      return;
    }

    (async () => {
      if (!accountTokenPositions?.data) return;

      if (accountTokenPositions?.data.length === 0) {
        setMessage("You don't have any positions");
        return;
      } else {
        setMessage(null);
      }

      const positionPromises = accountTokenPositions.data.map(
        async ({ asset, balance }) => {
          const assetIndex = getIndexOf(asset);
          const marketId = getMarketIdOf(asset);

          const saturated = Object.values(saturatedPoolsIndex?.data).find(
            (d) => d.market.marketId === marketId,
          );

          if (!saturated || !saturated.market || !saturated.market.categories)
            return;

          const market = saturated.market;

          if (
            market.marketType.categorical != null &&
            market.status === "Resolved" &&
            Number(market.resolvedOutcome) !== assetIndex
          ) {
            return;
          }

          const amount = formatBal(balance.free.toString());

          let outcome: any;
          const metadata = market.categories[assetIndex];
          if (typeof metadata === "string") {
            outcome = {
              name: metadata,
              ticker: metadata,
              color: "#ff0054",
            };
          } else {
            metadata["color"] = metadata["color"] || "#ffffff";
            outcome = metadata;
          }

          const marketEnd = await projectEndTimestamp(sdk.context, market, now);

          if (market.pool) {
            const poolId = market.pool.poolId;
            const prices = assetPricesHistoryLookup.data.get(asset) ?? [];
            const priceHistory = prices.map((record) => {
              return {
                time: new Date(record.timestamp).getTime(),
                v: record.newPrice,
              };
            });

            const pool = await poolStore.getPoolFromChain(Number(poolId));

            let currentPrice: number;

            if (market.status === "Resolved") {
              if (market.marketType.categorical != null) {
                currentPrice = 1;
              } else {
                const resolvedNumber = market.resolvedOutcome;
                const [loBound, hiBound] = market.marketType.scalar;
                const key =
                  asset["ScalarOutcome"][1].toLowerCase() === "long"
                    ? "longTokenValue"
                    : "shortTokenValue";
                currentPrice = calcScalarResolvedPrices(
                  new Decimal(loBound).div(ZTG),
                  new Decimal(hiBound).div(ZTG),
                  new Decimal(resolvedNumber).div(ZTG),
                )[key].toNumber();
              }
            } else {
              currentPrice = pool.assets.find(
                (asset) => asset.ticker === outcome.ticker,
              )?.price;
            }

            return {
              market: market,
              assetId: asset,
              marketEndTimeStamp: marketEnd as number,
              outcome,
              title: market.slug,
              amount: amount,
              price: currentPrice,
              priceHistory: priceHistory,
              change24hr: get24HrPriceChange(prices as PricePoint[]),
            };
          } else {
            return {
              market: market,
              assetId: asset,
              marketEndTimeStamp: marketEnd as number,
              outcome,
              title: market.slug,
              amount: amount,
              priceHistory: [],
              price: 0,
              marketCap: 0,
              change24hr: 0,
            };
          }
        },
      );

      const fullPositions = (await Promise.all(positionPromises)).filter(
        (p) => !!p,
      );

      const displayPositons: Position[] = [];

      fullPositions.forEach((position) => {
        const existingMarketIndex = displayPositons.findIndex(
          (p) => p.marketId === position.market.marketId.toString(),
        );

        if (existingMarketIndex === -1) {
          displayPositons.push({
            marketId: position.market.marketId.toString(),
            marketTitle: position.title,
            marketEndTimeStamp: position.marketEndTimeStamp,
            tableData: [createTableRow(position)],
          });
        } else {
          displayPositons[existingMarketIndex].tableData.push(
            createTableRow(position),
          );
        }
      });

      setPositions(displayPositons);
    })();
  }, [now, updateNum, accountTokenPositions?.data]);

  const createTableRow = (position) => {
    return {
      assetId: position.assetId,
      marketId: position.market.id,
      token: {
        color: position.outcome.color,
        label: position.outcome.ticker,
      },
      amount: position.amount,
      change: position.change24hr,
      history: position.priceHistory,
      sharePrice: {
        value: position.price,
        usdValue: 0,
      },
      total: {
        value: position.price * position.amount,
        usdValue: 0,
      },
      buttons: (
        <AssetActionButtons
          assetId={position.assetId}
          marketId={position.market.marketId}
          assetTicker={position.outcome.ticker}
        />
      ),
    };
  };

  const handleTimeFilterClick = (filter: TimeFilter) => {
    setTimeFilter(filter);
  };

  return (
    <>
      <InfoBoxes />

      <h2 className="header mb-ztg-23">Portfolio</h2>
      {message ? (
        <div>{message}</div>
      ) : (
        <>
          <div className="-ml-ztg-22 mb-ztg-30">
            <div className="flex justify-end -mt-ztg-30">
              <TimeFilters value={timeFilter} onClick={handleTimeFilterClick} />
            </div>
            <TimeSeriesChart
              data={chartData}
              series={[{ accessor: "v", label: "Price" }]}
              yUnits={store.config.tokenSymbol}
            />
          </div>
          {/* <RedeemAllButton
            marketStores={positions.map((p) => p.marketStore)}
            onSuccess={() => incrementUpdateNum()}
          /> */}
          <div className="mb-ztg-50  ">
            {positions.map((position, index) => (
              <PortfolioCard key={index} position={position} />
            ))}
          </div>
        </>
      )}
    </>
  );
});

const dateOneWeekAgo = new Date(
  new Date().getTime() - DAY_SECONDS * 28 * 1000,
).toISOString();

export default Portfolio;
