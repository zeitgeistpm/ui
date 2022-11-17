import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { ChevronLeft, Info } from "react-feather";
import FullSetButtons from "components/markets/FullSetButtons";
import InfoBoxes from "components/ui/InfoBoxes";
import Table, { TableColumn, TableData } from "components/ui/Table";
import MarketStore from "lib/stores/MarketStore";
import { usePoolsStore, CPool } from "lib/stores/PoolsStore";
import { useStore } from "lib/stores/Store";
import NotFoundPage from "pages/404";
import Pill from "components/ui/Pill";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import Link from "next/link";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { usePool } from "lib/hooks/queries/usePool";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import {
  NA,
  isAvailable,
  projectEndTimestamp,
  isIndexedData,
} from "@zeitgeistpm/sdk-next";
import { useQuery } from "@tanstack/react-query";

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

  const { ztgInfo } = store;
  const [tableData, setTableData] = useState<TableData[]>();

  const poolId = Number(router.query.poolid);

  const [sdk, id] = useSdkv2();
  const { data: pool } = usePool({ poolId });

  const { data: saturatedPoolIndex } = useSaturatedPoolsIndex(
    pool ? [pool] : undefined,
  );

  const saturatedPoolData = saturatedPoolIndex?.[poolId];

  const volume = isIndexedData(pool)
    ? new Decimal(pool.volume).div(ZTG).toFixed(2)
    : NA;

  const swapFee =
    typeof pool?.swapFee === "string"
      ? Number(pool?.swapFee)
      : pool?.swapFee.isSome
      ? pool?.swapFee.unwrap().toNumber()
      : 0;

  const { data: ends } = useQuery<number | NA>(
    [id, "market-ends", saturatedPoolData?.market.marketId],
    async () => projectEndTimestamp(sdk.context, saturatedPoolData.market),
    {
      enabled: Boolean(sdk && saturatedPoolData?.market),
    },
  );

  useEffect(() => {
    if (saturatedPoolData) {
      const tableData = saturatedPoolData.assets.map((asset) => ({
        token: {
          color: asset.category.color || "#ffffff",
          label: asset.category.ticker,
        },
        weights: asset.percentage,
        poolBalance: {
          value: asset.amount.div(ZTG).toFixed(2),
          usdValue: 0,
        },
      }));

      setTableData(tableData);
    }
  }, [saturatedPoolData]);

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
  ];

  const navigateBack = () => {
    router.push("/liquidity");
  };

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
            ends && isAvailable(ends)
              ? new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                }).format(new Date(ends))
              : ""
          }
        />
        <Pill
          title="Volume"
          value={`${isAvailable(volume) ? volume : "NA"} ZTG`}
        />
        <Pill title="Status" value={saturatedPoolData?.market.status} />
      </div>
      <div className="flex flex-row mt-ztg-53 mb-ztg-38">
        <PoolDetail
          header="Pool Value"
          middle={`${Math.round(
            saturatedPoolData?.liquidity.div(ZTG).toNumber() || 0,
          )} ${store?.config?.tokenSymbol ?? "--"}`}
          bottom={`${
            ztgInfo && saturatedPoolData
              ? ztgInfo?.price
                  ?.mul(saturatedPoolData?.liquidity.div(ZTG))
                  .toFixed(2)
              : "--"
          }`}
        />
        <PoolDetail
          className="mx-ztg-20"
          header="Fees"
          middle={`${new Decimal(swapFee).div(ZTG).mul(100)} %`}
          bottom=""
        />

        <PoolDetail header="APR" middle="" bottom="" showInfo={true} />
      </div>
      {/* <PoolChart /> */}
      {/* <PoolSummary /> */}
      <div className="flex my-ztg-23 items-center">
        <h3 className="font-space font-semibold text-ztg-20-150">
          Assets in Pool
        </h3>
        {saturatedPoolData && (
          <FullSetButtons marketId={saturatedPoolData.market.marketId} />
        )}
        {saturatedPoolData && (
          <Link href={`/markets/${saturatedPoolData?.market.marketId}`}>
            <span className="text-sky-600 bg-sky-200 dark:bg-black ml-auto uppercase font-bold text-ztg-12-120 rounded-ztg-5 px-ztg-20 py-ztg-5 ">
              Market
            </span>
          </Link>
        )}
      </div>
      <Table data={tableData} columns={columns} />
    </div>
  );
});

export default PoolDetails;
