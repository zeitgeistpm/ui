import { FullMarketFragment, FullPoolFragment } from "@zeitgeistpm/indexer";
import { parseAssetId } from "@zeitgeistpm/sdk-next";
import LiquidityModal from "components/liquidity/LiquidityModal";
import PoolTable from "components/liquidity/PoolTable";
import BuySellFullSetsButton from "components/markets/BuySellFullSetsButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { usePoolLiquidity } from "lib/hooks/queries/usePoolLiquidity";
import { formatNumberLocalized } from "lib/util";
import { getCurrentPrediction } from "lib/util/assets";
import { FC, PropsWithChildren, useState } from "react";

export const MarketLiquiditySection = ({
  market,
}: {
  market: FullMarketFragment;
}) => {
  return (
    <>
      <div className="mb-8">
        <LiquidityHeader market={market} />
      </div>
      <PoolTable
        poolId={market?.pool?.poolId}
        marketId={Number(market?.marketId)}
      />
    </>
  );
};

const LiquidityHeaderTextItem: FC<
  PropsWithChildren<{ label: string; className?: string }>
> = ({ label, children, className = "" }) => {
  return (
    <div className={"w-full border-gray-300 text-xs " + className}>
      <div className="center py-3 md:justify-start md:flex-col md:items-start">
        <div className="center mr-2 text-sky-600 font-semibold md:justify-start">
          {label}
        </div>
        <div className="font-semibold center">{children}</div>
      </div>
    </div>
  );
};

const LiquidityHeaderButtonItem: FC<PropsWithChildren<{ className?: string }>> =
  ({ children, className = "" }) => {
    return (
      <div
        className={
          "center border-pastel-blue w-full px-2 sm:px-8 md:px-0 " + className
        }
      >
        {children}
      </div>
    );
  };

const LiquidityHeader = ({ market }: { market: FullMarketFragment }) => {
  const { pool } = market;
  const { data: liquidity } = usePoolLiquidity({ poolId: pool.poolId });
  const swapFee = Number(pool?.swapFee ?? 0);
  const baseAssetId = parseAssetId(pool?.baseAsset).unrightOr(null);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const prediction =
    market && getCurrentPrediction(market?.pool?.assets, market);

  const [manageLiquidityOpen, setManageLiquidityOpen] = useState(false);

  const predictionDisplay =
    market?.marketType.scalar != null
      ? `${Number(prediction?.name).toFixed(2)}`
      : `${prediction?.name} ${prediction?.percentage}%`;

  return (
    <div className="md:flex md:justify-between">
      <div className="flex flex-col mb-8 sm:flex-row md:w-full md:mb-0">
        <LiquidityHeaderTextItem
          label="Pool Value"
          className="border-b-1 sm:border-r-1 sm:border-b-0 md:mr-6"
        >
          {formatNumberLocalized(liquidity?.div(ZTG).abs().toNumber() ?? 0)}{" "}
          {metadata?.symbol}
        </LiquidityHeaderTextItem>
        <LiquidityHeaderTextItem
          label="Fees"
          className="border-b-1 sm:border-b-0 sm:border-r-1 md:border-r-1 md:mr-6"
        >
          {new Decimal(swapFee).div(ZTG).mul(100).toNumber()} %
        </LiquidityHeaderTextItem>
        <LiquidityHeaderTextItem
          label="Prediction"
          className="border-b-1 sm:border-b-0 md:border-r-1"
        >
          {predictionDisplay}
        </LiquidityHeaderTextItem>
      </div>
      <div className="flex md:w-full">
        <LiquidityHeaderButtonItem className="border-r-1 md:mx-0">
          <BuySellFullSetsButton
            marketId={pool.marketId}
            buttonClassName="h-8 border-gray-300 border-1 rounded-full text-ztg-10-150 px-1 w-full md:w-auto sm:px-6 mx-auto"
          />
        </LiquidityHeaderButtonItem>
        <LiquidityHeaderButtonItem className="lg:-ml-14">
          <button
            className="h-8 border-gray-300 border-1 rounded-full text-ztg-10-150 px-1 w-full md:w-auto sm:px-6 mx-auto md:ml-auto md:mr-0"
            onClick={() => setManageLiquidityOpen(true)}
          >
            Add/Remove Liquidity
          </button>
        </LiquidityHeaderButtonItem>
      </div>
      <LiquidityModal
        poolId={pool.poolId}
        open={manageLiquidityOpen}
        onClose={() => setManageLiquidityOpen(false)}
      />
    </div>
  );
};
