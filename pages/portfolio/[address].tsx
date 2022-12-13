import { concatWith, from } from "rxjs";
import { observer } from "mobx-react";
import { NextPage } from "next";
import React, { useEffect, useMemo, useState } from "react";
import { Asset } from "@zeitgeistpm/types/dist/interfaces/index";
import { useRouter } from "next/router";
import { formatBal, isValidPolkadotAddress } from "lib/util";
import { useStore } from "lib/stores/Store";
import { useObservable } from "lib/hooks";
import TimeSeriesChart, { ChartData } from "components/ui/TimeSeriesChart";
import InfoBoxes from "components/ui/InfoBoxes";
import { useMarketsStore } from "lib/stores/MarketsStore";
import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import AssetActionButtons from "components/assets/AssetActionButtons";
import PortfolioCard, { Position } from "components/account/PortfolioCard";
import RedeemAllButton from "components/account/RedeemAllButton";
import { get24HrPriceChange, getAssetIds } from "lib/util/market";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { usePoolsStore } from "lib/stores/PoolsStore";
import { useAccountBalanceHistory } from "lib/hooks/queries/useAccountBalanceHistory";
import { useAccountTokenPositions } from "lib/hooks/queries/useAccountTokenPositions";

const Portfolio: NextPage = observer(() => {
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
    filters.find((f) => f.label === "Month"),
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

  const balanceHistory = useAccountBalanceHistory(address, timeFilter);
  const accountTokenPositions = useAccountTokenPositions(address);

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

      const dateOneWeekAgo = new Date(
        new Date().getTime() - DAY_SECONDS * 28 * 1000,
      ).toISOString();

      const positionPromises = accountTokenPositions.data.map(
        async (p, index) => {
          const { asset, balance } = p;
          const { marketId, assetId } = getAssetIds(asset as unknown as Asset);
          const assetIdJson = asset.toJSON();

          const market = await marketsStore.getMarket(marketId.toNumber());
          if (!market) return;
          //@ts-ignore
          const amount = formatBal(balance.free.toString());
          const assetCount = market.marketOutcomes.length - 1;

          let outcome: any;
          const metadata = market.outcomesMetadata[assetId];
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

          if (market.poolExists) {
            const poolId = market.pool.poolId;
            const prices = await store.sdk.models.getAssetPriceHistory(
              market.id,
              //@ts-ignore
              asset.isCategoricalOutcome
                ? //@ts-ignore
                  asset.asCategoricalOutcome?.[1]
                : //@ts-ignore
                  asset.asScalarOutcome?.[1].toString(),
              dateOneWeekAgo,
            );
            const priceHistory = prices.map((record) => {
              return {
                time: new Date(record.timestamp).getTime(),
                v: record.newPrice,
              };
            });

            const pool = await poolStore.getPoolFromChain(Number(poolId));
            const currentPrice = pool.assets.find(
              (asset) => asset.ticker === outcome.ticker,
            )?.price;

            const marketEnd = market.endTimestamp;
            return {
              id: index,
              market: market,
              assetId: assetIdJson,
              marketEndTimeStamp: marketEnd,
              outcome,
              title: market.slug,
              amount: amount,
              price: currentPrice,
              priceHistory: priceHistory,
              //@ts-ignore
              change24hr: get24HrPriceChange(prices),
              assetCount,
            };
          } else {
            return {
              id: index,
              market: market,
              assetId: assetIdJson,
              marketEndTimeStamp: market.endTimestamp,
              outcome,
              title: market.slug,
              amount: amount,
              priceHistory: [],
              price: 0,
              assetCount,
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
          (p) => p.marketId === position.market.id.toString(),
        );

        if (existingMarketIndex === -1) {
          displayPositons.push({
            marketId: position.market.id.toString(),
            marketTitle: position.title,
            marketEndTimeStamp: position.marketEndTimeStamp,
            tableData: [createTableRow(position)],
            marketStore: position.market,
          });
        } else {
          displayPositons[existingMarketIndex].tableData.push(
            createTableRow(position),
          );
        }
      });

      setPositions(displayPositons);
    })();
  }, [updateNum, accountTokenPositions]);

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
          marketId={position.market.id}
          assetColor={position.outcome.color}
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
          <RedeemAllButton
            marketStores={positions.map((p) => p.marketStore)}
            onSuccess={() => incrementUpdateNum()}
          />
          <div className="mb-ztg-50 font-lato ">
            {positions.map((position, index) => (
              <PortfolioCard key={index} position={position} />
            ))}
          </div>
        </>
      )}
    </>
  );
});

export default Portfolio;
