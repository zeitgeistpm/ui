import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { parseAssetId } from "@zeitgeistpm/sdk-next";
import LiquidityModal from "components/liquidity/LiquidityModal";
import PoolTable from "components/liquidity/PoolTable";
import BuySellFullSetsButton from "components/markets/BuySellFullSetsButton";
import { Loader } from "components/ui/Loader";
import SecondaryButton from "components/ui/SecondaryButton";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { usePoolLiquidity } from "lib/hooks/queries/usePoolLiquidity";
import { useWallet } from "lib/state/wallet";
import { isScalarRangeType } from "lib/types";
import { formatNumberLocalized } from "lib/util";
import { getCurrentPrediction } from "lib/util/assets";
import { formatScalarOutcome } from "lib/util/format-scalar-outcome";
import { FC, PropsWithChildren, useState } from "react";

export const MarketLiquiditySection = ({
  market,
  poll,
}: {
  market: FullMarketFragment;
  poll?: boolean;
}) => {
  return (
    <>
      {poll && !market?.pool?.poolId && (
        <>
          <div className="center">
            <div className="h-12 w-12 center bg-white mr-4">
              <Loader variant="Success" loading className="h-12 w-12" />
            </div>
            <h4 className="text-gray-400">Waiting for pool to be indexed</h4>
          </div>
        </>
      )}
      {market?.pool?.poolId && (
        <>
          <div className="mb-8">
            <LiquidityHeader market={market} />
          </div>
          <PoolTable
            poolId={market.pool.poolId}
            marketId={Number(market.marketId)}
          />
        </>
      )}
    </>
  );
};

const LiquidityHeaderTextItem: FC<
  PropsWithChildren<{ label: string; className?: string }>
> = ({ label, children, className = "" }) => {
  return (
    <div className={"w-full border-gray-300 text-xs " + className}>
      <div className="center py-3 md:justify-start sm:flex-col sm:items-center md:items-start">
        <div className="center mr-2 text-sky-600 font-semibold md:justify-start">
          {label}
        </div>
        <div className="font-semibold center sm:text-base">{children}</div>
      </div>
    </div>
  );
};

const LiquidityHeaderButtonItem: FC<PropsWithChildren<{ className?: string }>> =
  ({ children, className = "" }) => {
    return (
      <div
        className={
          "center border-pastel-blue w-full px-2 sm:px-8 md:px-0" + className
        }
      >
        {children}
      </div>
    );
  };

const LiquidityHeader = ({ market }: { market: FullMarketFragment }) => {
  const { pool } = market;
  const { data: liquidity } = usePoolLiquidity(
    pool?.poolId ? { poolId: pool.poolId } : undefined,
  );
  const swapFee = Number(pool?.swapFee ?? 0);
  const baseAssetId = pool?.baseAsset
    ? parseAssetId(pool.baseAsset).unrightOr(undefined)
    : undefined;
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const wallet = useWallet();

  const prediction =
    market &&
    market?.pool?.assets &&
    getCurrentPrediction(market.pool.assets, market);

  const [manageLiquidityOpen, setManageLiquidityOpen] = useState(false);

  const predictionDisplay =
    prediction && market && market.scalarType !== undefined
      ? market.marketType.scalar && isScalarRangeType(market.scalarType)
        ? formatScalarOutcome(prediction.price, market.scalarType)
        : `${prediction.name} ${prediction.percentage}%`
      : "";

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
        {!wallet.connected ? (
          <LiquidityHeaderButtonItem className="border-r-1 md:mx-0">
            <TransactionButton connectText="Connect Wallet to Manage Liquidity" />
          </LiquidityHeaderButtonItem>
        ) : (
          <>
            <LiquidityHeaderButtonItem className="border-b-1 sm:border-b-0 sm:border-r-1 md:border-r-1 md:mr-6">
              <BuySellFullSetsButton
                marketId={market.marketId}
                buttonClassName="h-8 border-gray-300 border-1 rounded-full text-ztg-10-150 px-1 w-full md:w-auto sm:px-6 mx-auto"
              />
            </LiquidityHeaderButtonItem>
            <LiquidityHeaderButtonItem className="lg:-ml-14">
              <SecondaryButton
                onClick={() => setManageLiquidityOpen(true)}
                className="max-w-[160px] md:ml-auto md:mr-0"
              >
                Manage Liquidity
              </SecondaryButton>
            </LiquidityHeaderButtonItem>
          </>
        )}
      </div>
      {pool?.poolId && (
        <LiquidityModal
          poolId={pool.poolId}
          open={manageLiquidityOpen}
          onClose={() => setManageLiquidityOpen(false)}
        />
      )}
    </div>
  );
};
