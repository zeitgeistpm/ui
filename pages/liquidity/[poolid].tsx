import { isIndexedData, parseAssetId } from "@zeitgeistpm/sdk-next";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
import PoolTable from "components/liquidity/PoolTable";
import BuySellFullSetsButton from "components/markets/BuySellFullSetsButton";
import InfoBoxes from "components/ui/InfoBoxes";
import Pill from "components/ui/Pill";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { usePoolLiquidity } from "lib/hooks/queries/usePoolLiquidity";
import { useSdkv2 } from "lib/hooks/useSdkv2";
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

const PoolDetails: NextPage = () => {
  const router = useRouter();

  const poolId = Number(router.query.poolid);
  const [sdk] = useSdkv2();
  const { data: pool, isInitialLoading, isFetched } = usePool({ poolId });
  const { data: market } = useMarket({ poolId });

  const baseAssetId = parseAssetId(pool?.baseAsset).unrightOr(null);
  const { data: metadata } = useAssetMetadata(baseAssetId);
  const { data: baseAssetUsdPrice } = useAssetUsdPrice(baseAssetId);
  const { data: liquidity } = usePoolLiquidity({ poolId });

  const volume = isIndexedData(pool)
    ? new Decimal(pool.volume).div(ZTG).toFixed(2)
    : null;

  const swapFee = Number(pool?.swapFee);

  const navigateBack = () => {
    router.push("/liquidity");
  };

  if (!sdk || poolId == null || market == null || isInitialLoading) {
    return null;
  }

  if (isFetched && pool == null && market.status === "Destroyed") {
    return <NotFoundPage backText="Back To Pools" backLink="/liquidity" />;
  }

  return (
    <>
      <div className="mb-8">
        <InfoBoxes />
        <div className="flex items-center mb-ztg-33">
          <h2>Market Pool</h2>
          <ChevronLeft
            size={20}
            className="cursor-pointer ml-5 mr-1"
            onClick={navigateBack}
          />
          <span className="text-sm ">Back to pools</span>
          <Link
            href={`/markets/${market.marketId}`}
            className="flex text-sky-600 bg-sky-200 dark:bg-black ml-auto uppercase font-bold text-ztg-12-120 rounded-ztg-5 px-ztg-20 py-ztg-5 justify-center items-center"
          >
            <BarChart2 size={14} className="mr-2" />
            <div className="flex content-end">Market</div>
          </Link>
        </div>
        <div className="flex flex-wrap">
          <Pill
            title="Ends"
            value={
              market?.period.end
                ? new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                  }).format(new Date(Number(market.period.end)))
                : ""
            }
          />
          <Pill
            title="Volume"
            value={`${volume ? volume : "0"} ${metadata?.symbol}`}
          />
          <Pill title="Status" value={pool?.poolStatus} />
        </div>
      </div>
      <div className="">
        <MarketLiquiditySection market={market} />
      </div>
    </>
  );
};

export default PoolDetails;
