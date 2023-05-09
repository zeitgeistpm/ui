import { FullPoolFragment } from "@zeitgeistpm/indexer";
import { parseAssetId } from "@zeitgeistpm/sdk-next";
import LiquidityModal from "components/liquidity/LiquidityModal";
import PoolTable, { Accessors } from "components/liquidity/PoolTable";
import BuySellFullSetsButton from "components/markets/BuySellFullSetsButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { usePoolLiquidity } from "lib/hooks/queries/usePoolLiquidity";
import { formatNumberLocalized } from "lib/util";
import { useState } from "react";
import { FullMarketFragment } from "@zeitgeistpm/indexer";

export const MarketLiquiditySection = ({
  market,
}: {
  market: FullMarketFragment;
}) => {
  return (
    <>
      <div className="mb-8">
        <LiquidityHeader pool={market?.pool} />
      </div>
      <PoolTable
        poolId={market?.pool?.poolId}
        marketId={Number(market?.marketId)}
      />
    </>
  );
};

const LiquidityHeader = ({ pool }: { pool: FullPoolFragment }) => {
  const { data: liquidity } = usePoolLiquidity({ poolId: pool.poolId });
  const swapFee = Number(pool?.swapFee ?? 0);
  const baseAssetId = parseAssetId(pool?.baseAsset).unrightOr(null);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const [manageLiquidityOpen, setManageLiquidityOpen] = useState(false);

  return (
    <div className="flex">
      <div className="flex-1 border-r-1 border-gray-300 py-3">
        <h4 className="text-gray-400 text-sm mb-2">Pool Value</h4>
        <div className="font-semibold">
          {formatNumberLocalized(liquidity?.div(ZTG).abs().toNumber() ?? 0)}{" "}
          {metadata?.symbol}
        </div>
      </div>
      <div className="flex-1 border-r-1 border-gray-300 pl-6 py-3">
        <h4 className="text-gray-400 text-sm mb-2">Fees</h4>
        <div className="font-semibold">
          {new Decimal(swapFee).div(ZTG).mul(100).toNumber()} %
        </div>
      </div>
      <div className="flex-1 border-r-1 border-gray-300 py-3 center">
        <BuySellFullSetsButton
          marketId={pool.marketId}
          buttonClassName="border-gray-300 text-sm border-2 rounded-full py-2 px-5"
        />
      </div>
      <div className="flex-1 center py-3">
        <button
          className="border-gray-300 text-sm border-2 rounded-full py-2 px-5"
          onClick={() => setManageLiquidityOpen(true)}
        >
          Add/Remove Liquidity
        </button>
      </div>

      <LiquidityModal
        poolId={pool.poolId}
        open={manageLiquidityOpen}
        onClose={() => setManageLiquidityOpen(false)}
      />
    </div>
  );
};
