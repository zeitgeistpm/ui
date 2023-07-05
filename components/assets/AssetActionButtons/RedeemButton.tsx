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
import * as AE from "@zeitgeistpm/utility/dist/aeither";
import SecondaryButton from "components/ui/SecondaryButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import {
  AccountAssetIdPair,
  useAccountAssetBalances,
} from "lib/hooks/queries/useAccountAssetBalances";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { calcScalarWinnings } from "lib/util/calc-scalar-winnings";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { extrinsicCallback, signAndSend } from "lib/util/tx";

import { useMemo, useState } from "react";

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
  const activeAccount = wallet?.activeAccount;

  const scalarBounds = getScalarBounds(market);

  const balanceQueries: AccountAssetIdPair[] = market.marketType.categorical
    ? [{ assetId, account: activeAccount?.address }]
    : [
        {
          account: activeAccount?.address,
          assetId: { ScalarOutcome: [market.marketId as MarketId, "Short"] },
        },
        {
          account: activeAccount?.address,
          assetId: { ScalarOutcome: [market.marketId as MarketId, "Long"] },
        },
      ];

  const { isLoading: isLoadingAssetBalance, get: getAccountAssetBalance } =
    useAccountAssetBalances(balanceQueries);

  const value = useMemo(() => {
    const zero = new Decimal(0);
    if (!activeAccount?.address || isLoadingAssetBalance) return zero;

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

      const balance = getAccountAssetBalance(
        activeAccount.address,
        resolvedAssetId,
      )?.data?.balance;
      return new Decimal(balance?.free.toString() ?? 0).div(ZTG);
    } else {
      const shortBalance = getAccountAssetBalance(activeAccount.address, {
        ScalarOutcome: [market.marketId as MarketId, "Short"],
      })?.data?.balance;

      const longBalance = getAccountAssetBalance(activeAccount.address, {
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
  const signer = wallet?.activeAccount;
  const notificationStore = useNotifications();

  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const baseAsset = parseAssetIdString(market.baseAsset);
  const { data: baseAssetMetadata } = useAssetMetadata(baseAsset);

  const handleClick = async () => {
    if (!isRpcSdk(sdk) || !signer) return;

    setIsRedeeming(true);

    const callback = extrinsicCallback({
      api: sdk.api,
      notifications: notificationStore,
      successCallback: async () => {
        notificationStore.pushNotification(
          `Redeemed ${value.toFixed(2)} ${baseAssetMetadata?.symbol}`,
          {
            type: "Success",
          },
        );
        setIsRedeeming(false);
        setIsRedeemed(true);
      },
      failCallback: (error) => {
        notificationStore.pushNotification(error, {
          type: "Error",
        });
        setIsRedeeming(false);
      },
    });

    const tx = sdk.api.tx.predictionMarkets.redeemShares(market.marketId);

    await AE.from(() => signAndSend(tx, signer, callback));

    setIsRedeeming(false);
  };

  return (
    <>
      {isRedeemed ? (
        <span className="text-green-500 font-bold">Redeemed Tokens!</span>
      ) : (
        <SecondaryButton
          onClick={handleClick}
          disabled={isRedeeming || value.eq(0)}
        >
          Redeem Tokens
        </SecondaryButton>
      )}
    </>
  );
};
