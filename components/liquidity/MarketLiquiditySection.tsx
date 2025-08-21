import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { parseAssetId } from "@zeitgeistpm/sdk";
import PoolTable from "components/liquidity/PoolTable";
import BuySellFullSetsButton from "components/markets/BuySellFullSetsButton";
import InfoPopover from "components/ui/InfoPopover";
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
        <>
          <div className="center">
            <div className="center mr-4 h-12 w-12 bg-white">
              <Loader variant="Success" loading className="h-12 w-12" />
            </div>
            <h4 className="text-gray-400">Waiting for pool to be indexed</h4>
          </div>
        </>
      )}
      {marketHasPool && (
        <>
          <div className="mb-8">
            <LiquidityHeader market={market} />
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
    <div className={"w-full border-gray-300 text-xs " + className}>
      <div className="center py-3 sm:flex-col sm:items-center md:items-start md:justify-start">
        <div className="center mr-2 font-semibold text-sky-600 md:justify-start">
          {label}
        </div>
        <div className="center font-semibold sm:text-base">{children}</div>
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

const LiquidityHeader = ({ market }: { market: FullMarketFragment }) => {
  const { pool, neoPool } = market;

  const { data: stats } = useMarketsStats([market.marketId]);

  const neoPoolLiquidity = neoPool?.totalStake ?? neoPool?.liquidityParameter
  const liquidity = new Decimal(stats?.[0].liquidity ? neoPoolLiquidity : 0);

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
          className="border-b-1 sm:border-b-0 sm:border-r-1 md:mr-6"
        >
          {formatNumberCompact(liquidity?.div(ZTG).abs().toNumber() ?? 0)}{" "}
          {metadata?.symbol}
        </LiquidityHeaderTextItem>
        <LiquidityHeaderTextItem
          label="Fees"
          className="border-b-1 sm:border-b-0 sm:border-r-1 md:mr-6 md:border-r-1"
        >
          {swapFee + creatorFee}%
          <InfoPopover
            className="ml-2"
            title={
              <h3 className="mb-4 flex items-center justify-center gap-2">
                <AiOutlineInfoCircle />
                Swap fees
              </h3>
            }
          >
            <div className="mt-6 flex w-full flex-col items-center gap-2">
              <p className="mb-4 flex gap-2 font-light">
                <span>Creator fee:</span>
                <span className="font-bold">{creatorFee}%</span>
              </p>
              <p className="mb-4 flex gap-2 font-light">
                <span>Pool fee:</span>
                <span className="font-bold">{swapFee}%</span>
              </p>
            </div>
          </InfoPopover>
        </LiquidityHeaderTextItem>
      </div>
      <div className="flex md:w-full">
        {!wallet.connected ? (
          <LiquidityHeaderButtonItem className="border-r-1 md:mx-0">
            <TransactionButton connectText="Connect Wallet to Manage Liquidity" />
          </LiquidityHeaderButtonItem>
        ) : (
          <>
            {/* <LiquidityHeaderButtonItem className="border-b-1 sm:border-b-0 sm:border-r-1 md:mr-6 md:border-r-1">
              <BuySellFullSetsButton
                marketId={market.marketId}
                buttonClassName="h-8 border-gray-300 border-1 rounded-full text-ztg-10-150 px-1 w-full md:w-auto sm:px-6 mx-auto"
              />
            </LiquidityHeaderButtonItem> */}
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
      {neoPool && (
        <LiquidityModalAmm2
          marketId={neoPool.marketId}
          open={manageLiquidityOpen}
          onClose={() => setManageLiquidityOpen(false)}
        />
      )}
    </div>
  );
};
