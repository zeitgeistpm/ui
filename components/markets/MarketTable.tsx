import Table, { TableColumn, TableData } from "components/ui/Table";
import { ChartData } from "components/ui/TimeSeriesChart";
import AssetActionButtons from "components/assets/AssetActionButtons";
import { get24HrPriceChange } from "lib/util/market";
import { CPool, usePoolsStore } from "lib/stores/PoolsStore";
import { useUserStore } from "lib/stores/UserStore";
import { calcTotalAssetPrice } from "lib/util/pool";
import { isPreloadedMarket, MarketCardData } from "lib/gql/markets";
import { DAY_SECONDS } from "lib/constants";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import market from "@zeitgeistpm/sdk/dist/models/market";


const MarketTable = observer(
  ({ marketStore }: { marketStore: MarketCardData }) => {
    const store = useStore();
    const { graphQlEnabled } = useUserStore();
    const poolStore = usePoolsStore();
    const [prices, setPrices] = useState<ChartData[][]>();
    const [priceHistories, setPriceHistories] = useState<
      {
        newPrice: number;
        timestamp: string;
      }[][]
    >();
    const isPreloaded = isPreloadedMarket(marketStore);
    const [pool, setPool] = useState<CPool>();

    const marketStorePool = !isPreloaded ? marketStore.pool : undefined;

    useEffect(() => {
      if (isPreloaded) {
        return;
      }
      const rawMarket = marketStore.market;
      (async () => {
        const dateOneWeekAgo = new Date(
          new Date().getTime() - DAY_SECONDS * 7 * 1000,
        ).toISOString();

        const poolId = marketStore.pool.poolId;

        const pool = await poolStore.getPoolFromChain(Number(poolId));
        setPool(pool);
        if (graphQlEnabled === true) {
          const pricePromises = rawMarket.outcomeAssets.map(async (asset) => {
            return store.sdk.models.getAssetPriceHistory(
              rawMarket.marketId,
              asset.isCategoricalOutcome
                ? asset.asCategoricalOutcome[1].toNumber()
                : asset.asScalarOutcome[1].toString(),
              dateOneWeekAgo,
            );
          });

          const priceHistories = await Promise.all(pricePromises);
          setPriceHistories(priceHistories);

          const chartPrices: ChartData[][] = priceHistories.map((p, index) => {
            if (p.length > 1) {
              return p.map((history) => ({
                v: history.newPrice,
                t: new Date(history.timestamp).getTime(),
              }));
            } else {
              // return straight line if there is no price history in the current week
              return [
                {
                  v: pool.assets[index].amount,
                  t: new Date(dateOneWeekAgo).getTime(),
                },
                {
                  v: pool.assets[index].amount,
                  t: new Date().getTime(),
                },
              ];
            }
          });
          setPrices(chartPrices);
        }
      })();
    }, [marketStore, marketStorePool]);

    // const totalAssetPrice = calcTotalAssetPrice(pool);

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
          marketPrice: {
            value: pool?.assets?.[index]?.price ?? 0,
            usdValue: 0,
          },
          pre: Math.round((pool?.assets?.[index]?.price ?? 0) * 100),
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
      tableData = marketStore.categories.map(category => {
        return {
          id: marketStore.id,
          token: {
            color: category.color,
            label: category.ticker,
          },
          outcome: category.name,
        }
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
