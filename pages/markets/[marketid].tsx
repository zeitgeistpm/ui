import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { extrinsicCallback } from "lib/util/tx";
import { calculatePoolCost, get24HrPriceChange } from "lib/util/market";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { useStore } from "lib/stores/Store";
import { useNotificationStore } from "lib/stores/NotificationStore";
import MarketStore from "lib/stores/MarketStore";
import { useNavigationStore } from "lib/stores/NavigationStore";
import { useMarketsStore } from "lib/stores/MarketsStore";
import PoolSettings, {
  PoolAssetRowData,
  poolRowDataFromOutcomes,
} from "components/liquidity/PoolSettings";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Pill from "components/ui/Pill";
import TimeSeriesChart, {
  ChartData,
  ChartSeries,
} from "components/ui/TimeSeriesChart";
import FullSetButtons from "components/markets/FullSetButtons";
import TransactionButton from "components/ui/TransactionButton";
import { AlertTriangle } from "react-feather";
import Link from "next/link";
import MarketTimer from "components/markets/MarketTimer";
import AssetActionButtons from "components/assets/AssetActionButtons";
import { CPool, usePoolsStore } from "lib/stores/PoolsStore";
import NotFoundPage from "pages/404";
import MarketAddresses from "components/markets/MarketAddresses";
import { MultipleOutcomeEntry } from "lib/types/create-market";
import { useUserStore } from "lib/stores/UserStore";

const LiquidityPill = observer(({ liquidity }: { liquidity: number }) => {
  const { config } = useStore();
  const [hoveringInfo, setHoveringInfo] = useState<boolean>(false);

  const handleMouseEnter = () => {
    setHoveringInfo(true);
  };

  const handleMouseLeave = () => {
    setHoveringInfo(false);
  };
  return (
    <div className="relative w-full">
      <Pill
        title="Liquidity"
        value={`${Math.round(liquidity)} ${config.tokenSymbol}`}
      >
        {liquidity < 100 ? (
          <span
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="bg-vermilion text-white rounded-ztg-5 px-ztg-5 ml-ztg-10"
          >
            LOW
          </span>
        ) : (
          <></>
        )}
      </Pill>
      {hoveringInfo === true ? (
        <div className="bg-sky-100 dark:bg-border-dark absolute left-ztg-100 rounded-ztg-10 text-black dark:text-white px-ztg-8 py-ztg-14 font-lato text-ztg-12-150 w-ztg-240">
          This market has low liquidity. Price slippage will be high for small
          trades and larger trades may be impossible
        </div>
      ) : (
        <></>
      )}
    </div>
  );
});

const MarketDetails = observer(() => {
  const router = useRouter();
  const { marketid } = router.query;
  const store = useStore();
  const { graphQlEnabled } = useUserStore();
  const notificationStore = useNotificationStore();
  const navigationStore = useNavigationStore();
  const marketsStore = useMarketsStore();
  const poolStore = usePoolsStore();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartSeries, setChartSeries] = useState<ChartSeries[]>([]);
  const [marketStore, setMarketStore] = useState<MarketStore>();
  const [tableData, setTableData] = useState<TableData[]>();
  const [poolRows, setPoolRows] = useState<PoolAssetRowData[]>();
  const [prizePool, setPrizePool] = useState<string>();
  const [marketLoaded, setMarketLoaded] = useState(false);
  const [poolAlreadyDeployed, setPoolAlreadyDeployed] = useState(false);
  const [pool, setPool] = useState<CPool>();

  const poolCost =
    poolRows && calculatePoolCost(poolRows.map((row) => Number(row.amount)));

  const columns: TableColumn[] = [
    {
      header: "Token",
      accessor: "token",
      type: "token",
    },
    { header: "PRE", accessor: "pre", type: "percentage" },
    { header: "Total Value", accessor: "totalValue", type: "currency" },
    { header: "Outcome", accessor: "outcome", type: "text" },
    {
      header: "24Hr Change",
      accessor: "change",
      type: "change",
      width: "120px",
    },
    {
      header: "",
      accessor: "buttons",
      type: "component",
      width: "140px",
    },
  ];

  useEffect(() => {
    navigationStore.setPage("marketDetails");
    (async () => {
      const market = await marketsStore?.getMarket(Number(marketid));
      if (market != null) {
        setMarketStore(market);
        setMarketLoaded(true);
        setPoolAlreadyDeployed(market.poolExists);
      }
    })();
  }, [marketsStore]);

  useEffect(() => {
    if (marketLoaded && poolAlreadyDeployed) {
      getPageData();
    }
  }, [marketStore?.pool]);

  useEffect(() => {
    if (marketStore == null) {
      return;
    }
    getPageData();
  }, [marketStore]);

  const getPageData = async () => {
    let tblData: TableData[] = [];

    const market = marketStore;

    if (market.poolExists) {
      const prizePool = await market.getPrizePool();
      setPrizePool(prizePool);

      const { poolId } = market.pool;

      // poolid is incorrectly typed, it's actually a string
      const pool = await poolStore.getPoolFromChain(Number(poolId));
      if (!pool) return;
      setPool(pool);

      const series: ChartSeries[] = [];
      let chartData: ChartData[] = [];
      const outcomes = market.marketOutcomes.filter(
        (o) => o.metadata !== "ztg",
      );

      const dateOneWeekAgo = new Date(
        new Date().getTime() - DAY_SECONDS * 28 * 1000,
      ).toISOString();

      for (const [index, assetId] of Array.from(
        market.outcomeAssetIds.entries(),
      )) {
        const ticker = market.outcomesMetadata[index]["ticker"];
        const color = market.outcomesMetadata[index]["color"] || "#ffffff";
        const outcomeName = market.outcomesMetadata[index]["name"];
        const currentPrice = pool.assets[index].price;

        let priceHistory: {
          newPrice: number;
          timestamp: string;
        }[];
        if (graphQlEnabled === true) {
          priceHistory = await store.sdk.models.getAssetPriceHistory(
            market.id,
            //@ts-ignore
            assetId.categoricalOutcome?.[1] ?? assetId.scalarOutcome?.[1],
            dateOneWeekAgo,
          );

          series.push({
            accessor: "v" + index,
            label: ticker,
            color,
          });

          const mappedHistory = priceHistory.map((history) => {
            return {
              t: new Date(history.timestamp).getTime(),
              ["v" + index]: history.newPrice,
            };
          });

          chartData.push(...mappedHistory);
        }

        const priceChange = priceHistory ? get24HrPriceChange(priceHistory) : 0;
        tblData = [
          ...tblData,
          {
            assetId,
            id: index,
            token: {
              color,
              label: ticker,
            },
            outcome: outcomeName,
            totalValue: {
              value: currentPrice,
              usdValue: 0,
            },
            pre: Math.round(currentPrice * 100),
            change: priceChange,
            buttons: (
              <AssetActionButtons
                assetId={assetId}
                marketId={market.id}
                assetColor={color}
                assetTicker={ticker}
              />
            ),
          },
        ];
      }

      setChartSeries(series);
      setChartData(chartData);
      setTableData(tblData);
    } else {
      tblData = market.outcomesMetadata.map((outcome) => ({
        token: {
          color: outcome["color"] || "#ffffff",
          label: outcome["ticker"],
        },
        outcome: outcome["name"],
      }));
      setTableData(tblData);
    }
  };

  const handleDeployClick = () => {
    const rows = poolRowDataFromOutcomes(
      marketStore.market.categories as MultipleOutcomeEntry[],
      store.config.tokenSymbol,
    );
    setPoolRows(rows);
  };

  const handleDeploySignClick = async () => {
    // We are asuming all rows have the same ammount
    const ammount = poolRows[0].amount;

    // return largest amount set for pool assets - this is amount for
    // complete set that will be needed
    const setAmountNeeded = poolRows.reduce<number>((acc, r) => {
      const amount = +r.amount;
      if (amount > acc) {
        return amount;
      }
      return acc;
    }, 100);

    const buySetTx = () => {
      return new Promise<void>((resolve, reject) => {
        marketStore.market.buyCompleteSet(
          signer,
          setAmountNeeded * ZTG,
          extrinsicCallback({
            notificationStore,
            successCallback: () => {
              notificationStore.pushNotification(
                "Bought complete set of " + setAmountNeeded + " assets",
                { type: "Success" },
              );
              resolve();
            },
            failCallback: ({ index, error }) => {
              notificationStore.pushNotification(
                store.getTransactionError(index, error),
                {
                  type: "Error",
                },
              );
              reject();
            },
          }),
        );
      });
    };
    const baseWeight = (1 / (poolRows.length - 1)) * 10 * ZTG;

    const weightsNums = poolRows.slice(0, -1).map((_) => {
      return baseWeight;
    });

    // total used for ztg weight
    const totalWeight = weightsNums.reduce<number>((acc, curr) => {
      return acc + curr;
    }, 0);

    const weightsParams = [
      ...weightsNums.map((w) => Math.floor(w).toString()),
      totalWeight.toString(),
    ];
    const signer = store.wallets.getActiveSigner();

    const deployPoolTx = () => {
      return new Promise<void>((resolve, reject) => {
        marketStore.market.deploySwapPool(
          signer,
          ammount,
          weightsParams,
          extrinsicCallback({
            notificationStore,
            successCallback: () => {
              notificationStore.pushNotification("Liquidity pool deployed", {
                type: "Success",
              });
              resolve();
            },
            failCallback: ({ index, error }) => {
              notificationStore.pushNotification(
                store.getTransactionError(index, error),
                {
                  type: "Error",
                },
              );
              reject();
            },
          }),
        );
      });
    };

    const addLiqudity = async (
      pool: Swap,
      assetIdx: number,
      amount: string,
    ) => {
      const asset = pool.assets[assetIdx];
      return new Promise<void>((resolve, reject) => {
        pool.poolJoinWithExactAssetAmount(
          signer,
          asset,
          amount,
          "0",
          extrinsicCallback({
            notificationStore,
            successCallback: () => {
              notificationStore.pushNotification(
                `Additional liquidity added - ${assetIdx} - ${amount}`,
                {
                  type: "Success",
                },
              );
              resolve();
            },
            failCallback: ({ index, error }) => {
              notificationStore.pushNotification(
                store.getTransactionError(index, error),
                {
                  type: "Error",
                },
              );
              reject();
            },
          }),
        );
      });
    };

    const additionalLiquidity = poolRows.map((r) => {
      return +r.amount - 100;
    });

    try {
      await buySetTx();
      await deployPoolTx();

      const pool = await marketStore.market.getPool();

      for (let i = 0, len = additionalLiquidity.length; i < len; i++) {
        if (additionalLiquidity[i] !== 0) {
          await addLiqudity(pool, i, `${additionalLiquidity[i] * ZTG}`);
        }
      }
    } catch {
      console.log("Unable to deploy liquidity pool.");
    }

    getPageData();
  };

  const getReportedOutcome = () => {
    let outcomeId: number;
    if (marketStore.is("Disputed") && marketStore.lastDispute) {
      // @ts-ignore
      outcomeId = marketStore.lastDispute.outcome.categorical;
    } else {
      outcomeId = marketStore.reportedOutcomeIndex;
    }
    const outcome = tableData?.find((data) => data.id === outcomeId);

    return outcome ? [outcome] : undefined;
  };

  const getWinningCategoricalOutcome = () => {
    const reportedOutcome = marketStore.resolvedCategoricalOutcome;

    const outcome = tableData?.find(
      (data) =>
        JSON.stringify(data.assetId) === JSON.stringify(reportedOutcome.asset),
    );

    return outcome ? [outcome] : undefined;
  };

  if (!marketLoaded) {
    return null;
  }

  if (marketStore == null) {
    return <NotFoundPage backText="Back To Markets" backLink="/" />;
  }

  return (
    <div>
      <div className="flex mb-ztg-33">
        <div className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0 bg-sky-600">
          {marketStore?.img ? (
            <img
              className="rounded-ztg-10"
              src={marketStore.img}
              alt="Market image"
              loading="lazy"
              width={70}
              height={70}
            />
          ) : (
            <img
              className="rounded-ztg-10"
              src="/icons/default-market.png"
              alt="Market image"
              loading="lazy"
              width={70}
              height={70}
            />
          )}
        </div>
        <div className="sub-header ml-ztg-20">{marketStore?.question}</div>
      </div>
      <div
        className="grid grid-flow-row-dense gap-4 w-full "
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
      >
        <Pill
          title="Ends"
          value={new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
          }).format(marketStore?.endTimestamp)}
        />
        <Pill title="Status" value={marketStore?.status} />
        {prizePool ? (
          <Pill
            title="Prize Pool"
            value={`${prizePool} ${store.config.tokenSymbol}`}
          />
        ) : (
          <></>
        )}
        {pool?.liquidity != null ? (
          <LiquidityPill liquidity={pool.liquidity} />
        ) : (
          <></>
        )}
      </div>
      <div className="mb-ztg-20">
        <MarketTimer marketStore={marketStore} />
      </div>
      {marketStore?.poolExists === true && graphQlEnabled === true ? (
        <div className="-ml-ztg-25">
          <TimeSeriesChart
            data={chartData}
            series={chartSeries}
            yDomain={[0, 1]}
          />
        </div>
      ) : (
        marketStore?.poolExists === false && (
          <div className="flex h-ztg-22 items-center font-lato bg-vermilion-light text-vermilion p-ztg-20 rounded-ztg-5">
            <div className="w-ztg-20 h-ztg-20">
              <AlertTriangle size={20} />
            </div>
            <div
              className="text-ztg-12-120 ml-ztg-10 "
              data-test="liquidityPoolMessage"
            >
              This market doesn't have a liquidity pool and therefore cannot be
              traded
            </div>
          </div>
        )
      )}
      {marketStore?.is("Reported") || marketStore?.is("Disputed") ? (
        <>
          <div className="sub-header mt-ztg-40">Reported Outcome</div>
          {marketStore.type === "categorical" ? (
            <Table columns={columns} data={getReportedOutcome()} />
          ) : (
            <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10">
              {
                //@ts-ignore
                marketStore.lastDispute?.outcome.scalar ??
                  marketStore.reportedScalarOutcome
              }
            </div>
          )}
        </>
      ) : (
        <></>
      )}
      {marketStore?.is("Resolved") ? (
        <>
          <div className="sub-header mt-ztg-40">Winning Outcome</div>
          {marketStore.type === "categorical" ? (
            <Table
              columns={columns}
              data={getWinningCategoricalOutcome() as TableData[]}
            />
          ) : (
            <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10">
              {marketStore.resolvedScalarOutcome}
            </div>
          )}
        </>
      ) : (
        <></>
      )}
      <div className="flex mt-ztg-40 items-center">
        <span className="sub-header">Outcomes</span>
        <FullSetButtons marketStore={marketStore} />
        {marketStore.pool ? (
          <Link href={`/liquidity/${marketStore.pool.poolId}`}>
            <a className="text-sky-600 bg-sky-200 dark:bg-black ml-auto uppercase font-bold text-ztg-12-120 rounded-ztg-5 px-ztg-20 py-ztg-5 ">
              Liquidity Pool
            </a>
          </Link>
        ) : (
          <></>
        )}
      </div>

      <Table columns={columns} data={tableData} />
      <div className="sub-header mt-ztg-40 mb-ztg-15">About Market</div>
      <div className="font-lato text-ztg-14-180 text-sky-600">
        {marketStore?.description}
      </div>
      {marketStore?.poolExists === false ? (
        poolRows ? (
          <div className="my-ztg-20">
            <div className="sub-header mt-ztg-40 mb-ztg-15">Deploy Pool</div>
            <PoolSettings
              data={poolRows}
              onChange={(v) => {
                setPoolRows(v);
              }}
            />
            <div className="flex items-center">
              <TransactionButton
                className="w-ztg-266 ml-ztg-8"
                onClick={handleDeploySignClick}
                disabled={store.wallets.activeBalance.lessThan(poolCost)}
              >
                Deploy Pool
              </TransactionButton>
              <div className="text-ztg-12-150 text-sky-600 font-bold ml-ztg-16">
                Total Cost:
                <span className="font-mono">
                  {" "}
                  {poolCost} {store.config.tokenSymbol}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!marketStore.is("Proposed") && (
              <button
                className="my-ztg-20 font-space font-bold text-ztg-16-150 text-sky-600 border-1 px-ztg-20 py-ztg-10 rounded-ztg-10 border-sky-600"
                data-test="deployLiquidityButton"
                onClick={handleDeployClick}
              >
                Deploy Liquidity Pool
              </button>
            )}
          </>
        )
      ) : (
        <></>
      )}
      <MarketAddresses marketStore={marketStore} />
    </div>
  );
});

export default MarketDetails;
