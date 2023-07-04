import {
  AssetId,
  getIndexOf,
  getScalarBounds,
  IndexerContext,
  IOCategoricalAssetId,
  isRpcSdk,
  Market,
  MarketId,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import SecondaryButton from "components/ui/SecondaryButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import {
  AccountAssetIdPair,
  useAccountAssetBalances,
} from "lib/hooks/queries/useAccountAssetBalances";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { calcScalarWinnings } from "lib/util/calc-scalar-winnings";

import { useMemo } from "react";

export type RedeemButtonProps = {
  market: Market<IndexerContext>;
  assetId: AssetId;
};

export const RedeemButton = (props: RedeemButtonProps) => {
  return <RedeemButtonByAssetId {...props} />;
};

export default RedeemButton;

export const RedeemButtonByAssetId = ({
  market,
  assetId,
}: {
  market: Market<IndexerContext>;
  assetId: AssetId;
}) => {
  const wallet = useWallet();
  const signer = wallet?.getActiveSigner();

  const scalarBounds = getScalarBounds(market);

  const balanceQueries: AccountAssetIdPair[] = market.marketType.categorical
    ? [{ assetId, account: signer?.address }]
    : [
        {
          account: signer?.address,
          assetId: { ScalarOutcome: [market.marketId as MarketId, "Short"] },
        },
        {
          account: signer?.address,
          assetId: { ScalarOutcome: [market.marketId as MarketId, "Long"] },
        },
      ];

  const { isLoading: isLoadingAssetBalance, get: getAccountAssetBalance } =
    useAccountAssetBalances(balanceQueries);

  const value = useMemo(() => {
    const zero = new Decimal(0);
    if (!signer?.address || isLoadingAssetBalance) return zero;

    if (market.marketType.categorical && IOCategoricalAssetId.is(assetId)) {
      const resolvedAssetIdString =
        market.outcomeAssets[Number(market.resolvedOutcome)];

      const resolvedAssetId = resolvedAssetIdString
        ? parseAssetId(resolvedAssetIdString).unrightOr(undefined)
        : undefined;

      if (
        !resolvedAssetId ||
        getIndexOf(resolvedAssetId) !== getIndexOf(assetId)
      )
        return zero;

      const balance = getAccountAssetBalance(signer.address, resolvedAssetId)
        ?.data?.balance;
      return new Decimal(balance?.free.toString() ?? 0).div(ZTG);
    } else {
      const shortBalance = getAccountAssetBalance(signer.address, {
        ScalarOutcome: [market.marketId as MarketId, "Short"],
      })?.data?.balance;

      const longBalance = getAccountAssetBalance(signer.address, {
        ScalarOutcome: [market.marketId as MarketId, "Long"],
      })?.data?.balance;

      if (!shortBalance || !longBalance) return zero;

      const bounds = scalarBounds.unwrap();
      const lowerBound = bounds[0].toNumber();
      const upperBound = bounds[1].toNumber();
      const resolvedNumber = Number(market.resolvedOutcome);

      return calcScalarWinnings(
        lowerBound,
        upperBound,
        new Decimal(resolvedNumber).div(ZTG),
        new Decimal(shortBalance.free.toNumber()).div(ZTG),
        new Decimal(longBalance.free.toNumber()).div(ZTG),
      );
    }
  }, [market, assetId, isLoadingAssetBalance, getAccountAssetBalance]);

  return <RedeemButtonByValue market={market} value={value} />;
};

const RedeemButtonByValue = ({
  market,
  value,
}: {
  market: Market<IndexerContext>;
  value: Decimal;
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const signer = wallet?.getActiveSigner();
  const notificationStore = useNotifications();

  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !signer) return;
      return sdk.api.tx.predictionMarkets.redeemShares(market.marketId);
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(`Redeemed ${value.toFixed(2)} ZTG`, {
          type: "Success",
        });
      },
    },
  );

  const handleClick = () => send();

  return (
    <>
      {isSuccess ? (
        <span className="text-green-500 font-bold">Redeemed Tokens!</span>
      ) : (
        <SecondaryButton
          onClick={handleClick}
          disabled={isLoading || value.eq(0)}
        >
          Redeem Tokens
        </SecondaryButton>
      )}
    </>
  );
};
