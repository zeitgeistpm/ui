import {
  AssetId,
  parseAssetId,
  getScalarBounds,
  IndexerContext,
  isNA,
  isRpcSdk,
  Market,
  MarketId,
} from "@zeitgeistpm/sdk-next";
import * as AE from "@zeitgeistpm/utility/dist/aeither";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import {
  AccountAssetIdPair,
  useAccountAssetBalances,
} from "lib/hooks/queries/useAccountAssetBalances";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { calcScalarWinnings } from "lib/util/calc-scalar-winnings";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useMemo, useState } from "react";

export type RedeemButtonProps = { market: Market<IndexerContext> } & (
  | { assetId: AssetId }
  | { value: Decimal }
);

export const RedeemButton = (props: RedeemButtonProps) => {
  if ("assetId" in props) {
    return <RedeemButtonByAssetId {...props} />;
  } else {
    return <RedeemButtonByValue {...props} />;
  }
};

export default RedeemButton;

export const RedeemButtonByAssetId = observer(
  ({
    market,
    assetId,
  }: {
    market: Market<IndexerContext>;
    assetId: AssetId;
  }) => {
    const store = useStore();
    const { wallets } = store;
    const signer = wallets?.getActiveSigner();

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

    const assetBalances = useAccountAssetBalances(balanceQueries);

    const value = useMemo(() => {
      if (market.marketType.categorical) {
        const resolvedAssetIdString =
          market.outcomeAssets[Number(market.resolvedOutcome)];

        const resolvedAssetId = parseAssetId(resolvedAssetIdString).unwrap();

        const balance = assetBalances?.get(signer?.address, resolvedAssetId)
          ?.data.balance;
        if (!balance || isNA(balance)) return new Decimal(0);

        return new Decimal(balance?.free.toString()).div(ZTG);
      } else {
        const shortBalance = assetBalances?.get(signer?.address, {
          ScalarOutcome: [market.marketId as MarketId, "Short"],
        })?.data?.balance;

        const longBalance = assetBalances?.get(signer?.address, {
          ScalarOutcome: [market.marketId as MarketId, "Long"],
        })?.data?.balance;

        if (
          !shortBalance ||
          isNA(shortBalance) ||
          !longBalance ||
          isNA(longBalance)
        )
          return new Decimal(0);

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
    }, [market, assetId, ...assetBalances.query.map((q) => q.data)]);

    return <RedeemButtonByValue market={market} value={value} />;
  },
);

export const RedeemButtonByValue = observer(
  ({ market, value }: { market: Market<IndexerContext>; value: Decimal }) => {
    const [sdk] = useSdkv2();

    const store = useStore();
    const { wallets } = store;
    const signer = wallets?.getActiveSigner();
    const notificationStore = useNotificationStore();

    const [isRedeeming, setIsRedeeming] = useState(false);
    const [isRedeemed, setIsRedeemed] = useState(false);

    const handleClick = async () => {
      if (!isRpcSdk(sdk)) return;

      setIsRedeeming(true);

      const callback = extrinsicCallback({
        notificationStore,
        successCallback: async () => {
          notificationStore.pushNotification(
            `Redeemed ${value.toFixed(2)} ZTG`,
            {
              type: "Success",
            },
          );
          setIsRedeeming(false);
          setIsRedeemed(true);
        },
        failCallback: ({ index, error }) => {
          notificationStore.pushNotification(
            store.getTransactionError(index, error),
            {
              type: "Error",
            },
          );
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
          <button
            onClick={handleClick}
            className={`text-blue-600 font-bold ${
              isRedeeming && "animate-pulse"
            }`}
            disabled={isRedeeming}
          >
            Redeem Tokens
          </button>
        )}
      </>
    );
  },
);
