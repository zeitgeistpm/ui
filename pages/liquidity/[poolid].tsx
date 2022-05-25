import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Info } from "react-feather";
import FullSetButtons from "components/markets/FullSetButtons";
import InfoBoxes from "components/ui/InfoBoxes";
import Table, { TableColumn, TableData } from "components/ui/Table";
import MarketStore from "lib/stores/MarketStore";
import { usePoolsStore, CPool } from "lib/stores/PoolsStore";
import { useStore } from "lib/stores/Store";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NotFoundPage from "pages/404";
import Pill from "components/ui/Pill";

interface Share {
  token: string;
  weights: number;
  poolBalance: number;
  yourBalance: number;
  assetValue: number;
  poolBalanceUSD: number;
  yourBalanceUSD: number;
  assetValueUSD: number;
}

const PoolDetail = ({
  header,
  middle,
  bottom,
  showInfo = false,
  className = "",
}) => {
  const [hoveringInfo, setHoveringInfo] = useState<boolean>(false);

  const handleMouseEnter = () => {
    setHoveringInfo(true);
  };

  const handleMouseLeave = () => {
    setHoveringInfo(false);
  };

  return (
    <>
      <div
        className={
          "flex flex-col h-ztg-89 w-full rounded-ztg-10 bg-sky-100 dark:bg-black p-ztg-15 " +
          className
        }
      >
        <div className="font-lato text-sky-600 text-ztg-12-150 font-bold">
          <div className="flex">
            <span>{header}</span>
            {showInfo === true ? (
              <div className="relative">
                <Info
                  size={19}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="inline cursor-pointer ml-ztg-10"
                />
                {hoveringInfo === true ? (
                  <div className="bg-sky-200 dark:bg-border-dark absolute left-ztg-50 bottom-ztg-20 rounded-ztg-5 text-black dark:text-white px-ztg-8 py-ztg-14 font-lato text-ztg-12-150 w-ztg-164">
                    <div className="font-bold border-b-1 border-sky-600 pb-ztg-7">
                      Total APR
                    </div>
                    <div className="font-normal border-b-1 border-sky-600 py-ztg-7">
                      Fees
                    </div>
                    <div className="font-normal pt-ztg-13">
                      Liquidity Mining
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
        <div className="font-bold font-mono text-ztg-14-150">{middle}</div>
        <div className="font-mono text-ztg-12-150 text-sky-600">{bottom}</div>
      </div>
    </>
  );
};

const PoolDetails: NextPage = observer(() => {
  const router = useRouter();
  const store = useStore();
  const [tableData, setTableData] = useState<TableData[]>();
  const [pool, setPool] = useState<CPool | null>(null);
  const poolsStore = usePoolsStore();
  const [marketStore, setMarketStore] = useState<MarketStore>();
  const [pageLoad, setPageLoad] = useState<boolean>(false);

  const poolId = Number(router.query.poolid);

  const setMarketData = async () => {
    const pool = await poolsStore.getPoolFromChain(poolId);
    if (pool != null) {
      setPool(pool);
      setMarketStore(pool.market);
    }
    setPageLoad(true);
  };

  useEffect(() => {
    setMarketData();
  }, [poolId, marketStore?.pool]);

  useEffect(() => {
    if (pool?.pool != null) {
      const tableData = pool.assets.map((asset) => ({
        token: { color: asset.color || "#ffffff", label: asset.ticker },
        weights: asset.percentage,
        poolBalance: {
          value: asset.amount.toFixed(2),
          usdValue: 0,
        },
      }));

      setTableData(tableData);
    }
  }, [pool?.pool]);

  const columns: TableColumn[] = [
    {
      header: "Token",
      accessor: "token",
      type: "token",
      width: "29%",
    },
    {
      header: "Weights",
      accessor: "weights",
      type: "percentage",
      width: "8%",
    },
    {
      header: "Pool Balance",
      accessor: "poolBalance",
      type: "currency",
      width: "33%",
    },
    // {
    //   header: "Your Balance",
    //   accessor: "yourBalance",
    //   type: "currency",
    // },
    // {
    //   header: "Asset Value",
    //   accessor: "assetValue",
    //   type: "currency",
    // },
  ];

  const navigateBack = () => {
    router.push("/liquidity");
  };

  if (pageLoad === false) {
    return null;
  }

  if (pool == null) {
    return <NotFoundPage backText="Back To Pools" backLink="/liquidity" />;
  }

  return (
    <div>
      <InfoBoxes />
      <div className="flex items-center mb-ztg-33">
        <h2 className="header">Market Pool</h2>
        <ChevronLeft
          size={20}
          className="cursor-pointer ml-5 mr-1"
          onClick={navigateBack}
        />
        <span className="text-sm font-lato">Back to pools</span>
      </div>
      <div className="flex flex-wrap">
        <Pill
          title="Ends"
          value={
            marketStore?.endTimestamp
              ? new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                }).format(new Date(marketStore.endTimestamp))
              : ""
          }
        />
        <Pill title="Volume" value="" />
        <Pill title="Status" value={pool?.pool.status} />
      </div>
      <div className="flex flex-row mt-ztg-53 mb-ztg-38">
        <PoolDetail
          header="Pool Value"
          middle={`${Math.round(pool.liquidity)} ${store.config.tokenSymbol}`}
          bottom="$0"
        />
        <PoolDetail
          className="mx-ztg-20"
          header="Fees"
          middle={`${pool?.pool.swapFee} ${store.config.tokenSymbol}`}
          bottom="$0"
        />

        <PoolDetail header="APR" middle="" bottom="" showInfo={true} />
      </div>
      {/* <PoolChart /> */}
      {/* <PoolSummary /> */}
      <div className="flex my-ztg-23 items-center">
        <h3 className="font-kanit font-semibold text-ztg-20-150">
          Assets in Pool
        </h3>
        {marketStore && <FullSetButtons marketStore={marketStore} />}
      </div>
      <Table data={tableData} columns={columns} />
    </div>
  );
});

export default PoolDetails;
