import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { ChartData } from "components/ui/TimeSeriesChart";
import AssetActionButtons from "components/assets/AssetActionButtons";
import { get24HrPriceChange } from "lib/util/market";
import { CPool, usePoolsStore } from "lib/stores/PoolsStore";
import { isPreloadedMarket, MarketCardData } from "lib/gql/markets-list";
import { AssetPrice } from "lib/gql/prices";
import { PoolAsset } from "lib/gql/pool";
import { DAY_SECONDS } from "lib/constants";
import { from } from "rxjs";

const MarketTable = observer(
  ({
    marketStore,
    priceHistories,
    assets,
  }: {
    marketStore: MarketCardData;
    priceHistories?: { [key: string]: AssetPrice[] };
    assets?: { price: number; assetId: string }[];
  }) => {
    const poolStore = usePoolsStore();
    const [prices, setPrices] = useState<ChartData[][]>();
    const isPreloaded = isPreloadedMarket(marketStore);
    const [pool, setPool] = useState<CPool>();

    const marketStorePool = !isPreloaded ? marketStore.pool : undefined;

    useEffect(() => {
      if (priceHistories == null || assets == null) {
        return;
      }
      let chartPrices: ChartData[][] = [];
      let index = 0;
      for (const assetId in priceHistories) {
        if (Object.prototype.hasOwnProperty.call(priceHistories, assetId)) {
          const prices = priceHistories[assetId];
          if (prices.length > 1) {
            chartPrices = [
              ...chartPrices,
              prices.map((history) => ({
                v: history.newPrice,
                t: new Date(history.timestamp).getTime(),
              })),
            ];
          } else {
            const dateOneWeekAgo = new Date(
              new Date().getTime() - DAY_SECONDS * 7 * 1000,
            ).toISOString();
            // return straight line if there is no price history in the current week
            chartPrices = [
              ...chartPrices,
              [
                {
                  v: assets[index].price,
                  t: new Date(dateOneWeekAgo).getTime(),
                },
                {
                  v: assets[index].price,
                  t: new Date().getTime(),
                },
              ],
            ];
          }
          index += 1;
        }
      }
      setPrices(chartPrices);
    }, [priceHistories, assets, marketStorePool]);

    useEffect(() => {
      if (isPreloaded) {
        return;
      }
      const poolId = marketStore.pool.poolId;

      const sub = from(poolStore.getPoolFromChain(Number(poolId))).subscribe(
        (p) => setPool(p),
      );
      return () => sub.unsubscribe();
    }, [marketStore, marketStorePool]);

    let tableData: TableData[];

    if (!isPreloaded) {
      tableData = marketStore.outcomeAssetIds.map((assetId, index) => {
        const metadata = marketStore.outcomesMetadata[index];
        const ticker = metadata["ticker"];
        const color = metadata["color"] || "#ffffff";
        const name = metadata["name"];

        return {
          id: index,
          token: {
            color: color,
            label: ticker,
          },
          outcome: name,
          history: prices?.[index],
          marketPrice: pool && {
            value: pool.assets[index].price,
            usdValue: 0,
          },
          pre: pool && Math.round(pool.assets[index].price * 100),
          change24hr: priceHistories?.[index]
            ? get24HrPriceChange(priceHistories[index])
            : 0,
          buttons: (
            <AssetActionButtons
              assetId={assetId}
              marketId={marketStore.id}
              assetColor={color}
              assetTicker={ticker}
            />
          ),
        };
      });
    } else {
      tableData = marketStore.categories.map((category, index) => {
        const asset = assets?.[index];
        const histories = priceHistories?.[asset.assetId];
        return {
          id: marketStore.id,
          token: {
            color: category.color,
            label: category.ticker,
          },
          history: prices?.[index],
          pre: asset && Math.round(asset.price * 100),
          marketPrice: assets && {
            value: assets[index].price,
            usdValue: 0,
          },
          change24hr: histories ? get24HrPriceChange(histories) : undefined,
          outcome: category.name,
          buttons: (
            <AssetActionButtons
              marketId={marketStore.id}
              assetColor={category.color}
              assetTicker={category.ticker}
            />
          ),
        };
      });
    }

    const columns: TableColumn[] = [
      {
        header: "Token",
        accessor: "token",
        type: "token",
      },
      {
        header: "Implied %",
        accessor: "pre",
        type: "percentage",
      },
      {
        header: "Market Price",
        accessor: "marketPrice",
        type: "currency",
      },
      {
        header: "24Hrs",
        accessor: "change24hr",
        type: "change",
      },
      {
        header: "Graph",
        accessor: "history",
        type: "graph",
        width: "140px",
      },
      {
        header: "",
        accessor: "buttons",
        type: "component",
        width: "140px",
      },
    ];
    return (
      <div>
        <Table
          columns={columns}
          data={tableData}
          rowColorClass="bg-white dark:bg-sky-700"
        />
      </div>
    );
  },
);
export default MarketTable;
