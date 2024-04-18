import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  IOBaseAssetId,
  IOCategoricalAssetId,
  getIndexOf,
  isRpcSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import SecondaryButton from "components/ui/SecondaryButton";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { usePool } from "lib/hooks/queries/usePool";
import { usePoolBaseBalance } from "lib/hooks/queries/usePoolBaseBalance";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { parseAssetIdString } from "lib/util/parse-asset-id";

const RedeemPoolButton = ({
  poolId,
  market,
}: {
  poolId: number;
  market: FullMarketFragment;
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
  const poolsTotalIssuance = useTotalIssuanceForPools([poolId]);
  const { data: totalPoolSharesIssuance } = poolsTotalIssuance[poolId];
  const userPercentageOwnership =
    userPoolShares && totalPoolSharesIssuance?.totalIssuance
      ? userPoolShares.div(totalPoolSharesIssuance.totalIssuance.toNumber())
      : new Decimal(0);

  // filter out non-winning assets as they are deleted on chain
  const poolWeights =
    market.status === "Resolved" && market.marketType.categorical
      ? pool?.weights.filter((weight) => {
          const assetId = weight && parseAssetId(weight.assetId).unwrap();

          return (
            IOBaseAssetId.is(assetId) ||
            (IOCategoricalAssetId.is(assetId) &&
              market.resolvedOutcome === getIndexOf(assetId).toString())
          );
        })
      : pool?.weights;

  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (
        !isRpcSdk(sdk) ||
        !constants ||
        !userPoolShares ||
        !poolWeights ||
        userPoolShares.equals(0)
      )
        return;

      const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;
      const feeMultiplier = 1 - constants.swaps.exitFee;

      const minAssetsOut = poolWeights.map((asset, index) => {
        if (!asset) return "0";
        const assetId = parseAssetIdString(asset.assetId);

        const assetIndex = IOCategoricalAssetId.is(assetId)
          ? getIndexOf(assetId)
          : index;

        const assetAmount = IOBaseAssetId.is(assetId)
          ? poolBaseBalance?.mul(userPercentageOwnership)
          : new Decimal(
              poolAssetBalances?.[assetIndex]?.free.toString() ?? 0,
            ).mul(userPercentageOwnership);

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
      const redeem = sdk.api.tx.predictionMarkets.redeemShares(market.marketId);

      return sdk.api.tx.utility.batchAll([exitPool, redeem]);
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          "Successfully withdrew and redeemed all pool shares",
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
      className="ml-auto max-w-[160px]"
    >
      Redeem Pool
    </SecondaryButton>
  );
};

const PoolShareButtons = ({
  poolId,
  market,
}: {
  poolId: number;
  market: FullMarketFragment;
}) => {
  return <RedeemPoolButton poolId={poolId} market={market} />;
};

export default PoolShareButtons;
