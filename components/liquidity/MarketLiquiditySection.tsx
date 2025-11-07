import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { parseAssetId } from "@zeitgeistpm/sdk";
import PoolTable from "components/liquidity/PoolTable";
import BuySellFullSetsButton from "components/markets/BuySellFullSetsButton";
import { Loader } from "components/ui/Loader";
import SecondaryButton from "components/ui/SecondaryButton";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useWallet } from "lib/state/wallet";
import { isScalarRangeType } from "lib/types";
import { getCurrentPrediction } from "lib/util/assets";
import { formatScalarOutcome } from "lib/util/format-scalar-outcome";
import { perbillToNumber } from "lib/util/perbill-to-number";
import { FC, PropsWithChildren, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { ScoringRule } from "@zeitgeistpm/indexer";
import LiquidityModalAmm2 from "./LiquidityModalAmm2";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { formatNumberCompact } from "lib/util/format-compact";

export const MarketLiquiditySection = ({
  market,
  pool,
  comboMarket,
}: {
  market: FullMarketFragment;
  pool?: boolean;
  comboMarket?: boolean;
}) => {
  const marketHasPool = market.neoPool != null;

  return (
    <>
      {pool && !marketHasPool && (
        <div className="center rounded-lg bg-white/10 p-8 shadow-sm backdrop-blur-md">
          <div className="center mr-4 h-12 w-12">
            <Loader variant="Success" loading className="h-12 w-12" />
          </div>
          <h4 className="font-semibold text-white/90">
            Waiting for pool to be indexed
          </h4>
        </div>
      )}
      {marketHasPool && (
        <>
          <div className="mb-8">
            <LiquidityHeader market={market} comboMarket={comboMarket} />
          </div>
          <PoolTable
            poolId={market.pool?.poolId ?? market.neoPool?.poolId}
            marketId={Number(market.marketId)}
            marketData={market}
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
    <div className={"w-full text-sm " + className}>
      <div className="center py-3 sm:flex-col sm:items-center md:items-start md:justify-start">
        <div className="center mr-2 font-semibold text-white/70 md:justify-start">
          {label}
        </div>
        <div className="center font-bold text-white/90 sm:text-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

const LiquidityHeaderButtonItem: FC<
  PropsWithChildren<{ className?: string }>
> = ({ children, className = "" }) => {
  return (
    <div
      className={
        "center w-full border-pastel-blue px-2 sm:px-8 md:px-0" + className
      }
    >
      {children}
    </div>
  );
};

const LiquidityHeader = ({
  market,
  comboMarket,
}: {
  market: FullMarketFragment;
  comboMarket?: boolean;
}) => {
  const { pool, neoPool } = market;

  const { data: stats } = useMarketsStats([market.marketId]);
  const neoPoolLiquidity =
    (neoPool as any)?.totalShares ??
    neoPool?.liquiditySharesManager?.reduce(
      (total: any, manager: any) => total + Number(manager.stake),
      0,
    ) ??
    neoPool?.liquidityParameter;

  const liquidity = new Decimal(stats?.[0]?.liquidity ?? neoPoolLiquidity);

  const swapFee = new Decimal(Number(pool?.swapFee ?? neoPool?.swapFee ?? 0))
    .div(ZTG)
    .mul(100)
    .toNumber();
  const creatorFee = perbillToNumber(market?.creatorFee ?? 0) * 100;

  const baseAssetId = market?.baseAsset
    ? parseAssetId(market.baseAsset).unrightOr(undefined)
    : undefined;
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const wallet = useWallet();

  const prediction =
    market && market?.assets && getCurrentPrediction(market.assets, market);

  const [manageLiquidityOpen, setManageLiquidityOpen] = useState(false);

  const predictionDisplay =
    prediction && market && market.scalarType !== undefined
      ? market.marketType.scalar && isScalarRangeType(market.scalarType)
        ? formatScalarOutcome(prediction.price, market.scalarType)
        : `${prediction.name} ${prediction.percentage}%`
      : "";

  return (
    <div className="md:flex md:justify-between">
      <div className="mb-8 flex flex-col sm:flex-row md:mb-0 md:w-full">
        <LiquidityHeaderTextItem
          label="Pool Value"
          className="border-b-2 border-white/10 sm:border-b-0 sm:border-r-2 md:mr-6"
        >
          {formatNumberCompact(liquidity?.div(ZTG).abs().toNumber() ?? 0)}{" "}
          {metadata?.symbol}
        </LiquidityHeaderTextItem>
        <LiquidityHeaderTextItem
          label="Fees"
          className="border-b-2 border-white/10 sm:border-b-0 sm:border-r-2 md:mr-6"
        >
          <div className="flex items-center gap-2">
            {swapFee + creatorFee}%
            <div className="group relative">
              <div className="cursor-help text-white/70 transition-colors hover:text-white/90">
                <AiOutlineInfoCircle className="h-3.5 w-3.5" />
              </div>
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-10 mb-1 w-64 whitespace-normal opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
                  <div className="mb-1 font-medium">Swap Fees</div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Creator fee:</span>
                    <span className="font-semibold">{creatorFee}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Pool fee:</span>
                    <span className="font-semibold">{swapFee}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LiquidityHeaderTextItem>
      </div>
      <div className="flex md:w-full">
        {!wallet.connected ? (
          <LiquidityHeaderButtonItem className="border-r-1 md:mx-0">
            <TransactionButton connectText="Connect Wallet to Manage Liquidity" />
          </LiquidityHeaderButtonItem>
        ) : (
          <>
            <LiquidityHeaderButtonItem className="lg:-ml-14">
              <button
                onClick={() => setManageLiquidityOpen(true)}
                className="max-w-[200px] rounded-lg bg-ztg-green-600/80 px-6 py-2.5 font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-lg focus:outline-none md:ml-auto md:mr-0"
              >
                Manage Liquidity
              </button>
            </LiquidityHeaderButtonItem>
          </>
        )}
      </div>
      {neoPool && (
        <>
          {/* TODO: Buy/Sell Full Sets not yet compatible with combinatorial token system */}
          {/* <LiquidityHeaderButtonItem>
            <BuySellFullSetsButton marketId={neoPool.marketId} />
          </LiquidityHeaderButtonItem> */}
          <LiquidityModalAmm2
            marketId={comboMarket ? 0 : neoPool.marketId}
            poolId={neoPool.poolId}
            virtualMarket={market}
            open={manageLiquidityOpen}
            onClose={() => setManageLiquidityOpen(false)}
          />
        </>
      )}
    </div>
  );
};
