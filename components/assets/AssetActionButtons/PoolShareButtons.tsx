import LiquidityModal from "components/liquidity/LiquidityModal";
import SecondaryButton from "components/ui/SecondaryButton";
import { usePool } from "lib/hooks/queries/usePool";
import { useState } from "react";
import { MarketStatus } from "@zeitgeistpm/indexer";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useNotifications } from "lib/state/notifications";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { IOBaseAssetId, ZTG, isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useWallet } from "lib/state/wallet";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { usePoolBaseBalance } from "lib/hooks/queries/usePoolBaseBalance";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { useTotalIssuance } from "lib/hooks/queries/useTotalIssuance";
import Decimal from "decimal.js";
import { parseAssetIdString } from "lib/util/parse-asset-id";

const RedeemPoolButton = ({
  poolId,
  marketId,
}: {
  poolId: number;
  marketId: number;
}) => {
  const notificationStore = useNotifications();
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const { data: pool } = usePool({ poolId });
  const { data: constants } = useChainConstants();
  const { data: userPoolShares } = useBalance(wallet.realAddress, {
    PoolShare: poolId,
  });
  const { data: poolAssetBalances } = useAccountPoolAssetBalances(
    pool?.account.accountId,
    pool,
  );
  const { data: poolBaseBalance } = usePoolBaseBalance(poolId);
  const { data: totalPoolSharesIssuance } = useTotalIssuance({
    PoolShare: poolId,
  });
  const userPercentageOwnership =
    userPoolShares && totalPoolSharesIssuance
      ? userPoolShares.div(totalPoolSharesIssuance)
      : new Decimal(0);

  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !constants || !userPoolShares || !pool) return;

      const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;
      const feeMultiplier = 1 - constants.swaps.exitFee;

      const minAssetsOut = pool.weights.map((asset, index) => {
        if (!asset) return "0";
        const assetId = parseAssetIdString(asset.assetId);

        const assetAmount = IOBaseAssetId.is(assetId)
          ? poolBaseBalance?.mul(userPercentageOwnership)
          : new Decimal(poolAssetBalances?.[index]?.free.toString() ?? 0);

        return assetAmount
          ? assetAmount
              .mul(slippageMultiplier)
              .mul(feeMultiplier)
              .toFixed(0, Decimal.ROUND_DOWN)
          : "0";
      });

      const exitPool = sdk.api.tx.swaps.poolExit(
        poolId,
        userPoolShares.toFixed(0),
        minAssetsOut,
      );
      const redeem = sdk.api.tx.predictionMarkets.redeemShares(marketId);

      return sdk.api.tx.utility.batchAll([exitPool, redeem]);
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          "Successfully withdrew all pool shares and redeemed them",
          {
            type: "Success",
          },
        );
      },
    },
  );

  const handleRedeemPoolClick = () => {
    send();
  };

  return (
    <SecondaryButton
      onClick={handleRedeemPoolClick}
      disabled={isLoading || isSuccess || userPercentageOwnership.eq(0)}
      className="max-w-[160px] ml-auto"
    >
      Redeem Pool
    </SecondaryButton>
  );
};

const PoolShareButtons = ({
  poolId,
  marketStatus,
  marketId,
}: {
  poolId: number;
  marketStatus: MarketStatus;
  marketId: number;
}) => {
  const [manageLiquidityOpen, setManageLiquidityOpen] = useState(false);

  return (
    <>
      {marketStatus === MarketStatus.Resolved ? (
        <RedeemPoolButton poolId={poolId} marketId={marketId} />
      ) : (
        <>
          <SecondaryButton
            onClick={() => setManageLiquidityOpen(true)}
            className="max-w-[160px] ml-auto"
          >
            Manage Liquidity
          </SecondaryButton>
          <LiquidityModal
            poolId={poolId}
            open={manageLiquidityOpen}
            onClose={() => setManageLiquidityOpen(false)}
          />
        </>
      )}
    </>
  );
};

export default PoolShareButtons;
