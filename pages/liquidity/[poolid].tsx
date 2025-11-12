import { isIndexedData } from "@zeitgeistpm/sdk";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
import Pill from "components/ui/Pill";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { usePoolLiquidity } from "lib/hooks/queries/usePoolLiquidity";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { parseAssetIdString } from "lib/util/parse-asset-id";
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
          "flex h-ztg-89 w-full flex-col rounded-ztg-10 bg-ztg-primary-100 p-ztg-15 dark:bg-black " +
          className
        }
      >
        <div className=" text-ztg-12-150 font-bold text-ztg-primary-600">
          <div className="flex">
            <span>{header}</span>
            {showInfo === true ? (
              <div className="relative">
                <Info
                  size={19}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="ml-ztg-10 inline cursor-pointer"
                />
                {hoveringInfo === true ? (
                  <div className="absolute bottom-ztg-20 left-ztg-50 w-ztg-164 rounded-ztg-5 bg-ztg-primary-200 px-ztg-8 py-ztg-14 text-ztg-12-150 text-black  dark:bg-border-dark dark:text-white/90">
                    <div className="border-b-1 border-ztg-primary-600 pb-ztg-7 font-bold">
                      Total APR
                    </div>
                    <div className="border-b-1 border-ztg-primary-600 py-ztg-7 font-normal">
                      Fees
                    </div>
                    <div className="pt-ztg-13 font-normal">
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
        <div className="font-mono text-ztg-14-150 font-bold">{middle}</div>
        <div className="font-mono text-ztg-12-150 text-ztg-primary-600">
          {bottom}
        </div>
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

  const baseAssetId = parseAssetIdString(market?.baseAsset);
  const { data: metadata } = useAssetMetadata(baseAssetId);
  const { data: liquidity } = usePoolLiquidity({ poolId });

  const volume = isIndexedData(pool)
    ? new Decimal(market?.volume ?? 0).div(ZTG).toFixed(2)
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
        <div className="mb-ztg-33 flex items-center">
          <h2>Market Pool</h2>
          <ChevronLeft
            size={20}
            className="ml-5 mr-1 cursor-pointer"
            onClick={navigateBack}
          />
          <span className="text-sm ">Back to pools</span>
          <Link
            href={`/markets/${market.marketId}`}
            className="ml-auto flex items-center justify-center rounded-ztg-5 bg-ztg-primary-200 px-ztg-20 py-ztg-5 text-ztg-12-120 font-bold uppercase text-ztg-primary-600 dark:bg-black"
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
          <Pill title="Status" value={pool?.status ?? ""} />
        </div>
      </div>
      <div className="">
        <MarketLiquiditySection market={market} />
      </div>
    </>
  );
};

export default PoolDetails;
