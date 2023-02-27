import { useQuery } from "@tanstack/react-query";
import { isIndexedData, projectEndTimestamp } from "@zeitgeistpm/sdk-next";
import PoolTable from "components/liquidity/PoolTable";
import FullSetButtons from "components/markets/FullSetButtons";
import MarketMeta from "components/meta/MarketMeta";
import InfoBoxes from "components/ui/InfoBoxes";
import Pill from "components/ui/Pill";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { usePool } from "lib/hooks/queries/usePool";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useZtgInfo } from "lib/hooks/queries/useZtgInfo";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useState } from "react";
import { BarChart2, ChevronLeft, Info } from "react-feather";

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
        <div className=" text-sky-600 text-ztg-12-150 font-bold">
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
                  <div className="bg-sky-200 dark:bg-border-dark absolute left-ztg-50 bottom-ztg-20 rounded-ztg-5 text-black dark:text-white px-ztg-8 py-ztg-14  text-ztg-12-150 w-ztg-164">
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

  const { data: ztgInfo } = useZtgInfo();

  const poolId = Number(router.query.poolid);

  const [sdk, id] = useSdkv2();
  const { data: pool, isInitialLoading, isFetched } = usePool({ poolId });

  const { data: saturatedPoolIndex } = useSaturatedPoolsIndex(
    pool ? [pool] : undefined,
  );

  const saturatedPoolData = saturatedPoolIndex?.[poolId];

  const { data: ends } = useQuery<number>(
    [id, "market-ends", saturatedPoolData?.market.marketId],
    async () => projectEndTimestamp(sdk, saturatedPoolData.market),
    {
      enabled: Boolean(sdk && saturatedPoolData?.market),
    },
  );

  const volume = isIndexedData(pool)
    ? new Decimal(pool.volume).div(ZTG).toFixed(2)
    : null;

  const swapFee = Number(pool?.swapFee);

  const prediction = saturatedPoolData?.assets
    .sort((a, b) => (a.price.greaterThan(b.price) ? 1 : 0))
    .at(0);

  const navigateBack = () => {
    router.push("/liquidity");
  };

  if (!sdk || poolId == null || isInitialLoading) {
    return null;
  }

  if (isFetched && pool === null) {
    return <NotFoundPage backText="Back To Pools" backLink="/liquidity" />;
  }

  return (
    <>
      <MarketMeta market={saturatedPoolData?.market} />
      <div>
        <InfoBoxes />
        <div className="flex items-center mb-ztg-33">
          <h2 className="header">Market Pool</h2>
          <ChevronLeft
            size={20}
            className="cursor-pointer ml-5 mr-1"
            onClick={navigateBack}
          />
          <span className="text-sm ">Back to pools</span>
        </div>
        <div className="flex flex-wrap">
          <Pill
            title="Ends"
            value={
              ends
                ? new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                  }).format(new Date(ends))
                : ""
            }
          />
          <Pill title="Volume" value={`${volume ? volume : "0"} ZTG`} />
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

          <PoolDetail
            header="Prediction"
            middle={
              <div className="flex mt-2">
                <div
                  className="rounded-full w-ztg-20 h-ztg-20 mr-ztg-10 border-sky-600 border-2"
                  style={{ backgroundColor: prediction?.category.color }}
                />
                {prediction?.category.ticker.toUpperCase()}
              </div>
            }
            bottom=""
          />
        </div>
        {/* <PoolChart /> */}
        {/* <PoolSummary /> */}
        <div className="flex my-ztg-23 items-center">
          <h3 className=" font-semibold text-ztg-20-150">Assets in Pool</h3>
          {saturatedPoolData && (
            <FullSetButtons marketId={saturatedPoolData.market.marketId} />
          )}
          {saturatedPoolData && (
            <div className="flex flex-1 justify-end">
              <Link
                href={`/markets/${saturatedPoolData?.market.marketId}`}
                className="flex text-sky-600 bg-sky-200 dark:bg-black ml-auto uppercase font-bold text-ztg-12-120 rounded-ztg-5 px-ztg-20 py-ztg-5 justify-center items-center"
              >
                <BarChart2 size={14} className="mr-2" />
                <div className="flex content-end">Market</div>
              </Link>
            </div>
          )}
        </div>
        <PoolTable poolId={poolId} />
      </div>
    </>
  );
});

export default PoolDetails;
