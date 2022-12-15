import {
  AssetId,
  getScalarBounds,
  IndexerContext,
  isNA,
  isRpcSdk,
  Market,
  MarketId,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import {
  AccountAssetIdPair,
  useAccountAssetBalances,
} from "lib/hooks/queries/useAccountAssetBalances";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useMemo } from "react";

const RedeemButton = observer(
  ({
    market,
    assetId,
  }: {
    market: Market<IndexerContext>;
    assetId: AssetId;
  }) => {
    const [sdk] = useSdkv2();
    const store = useStore();
    const { wallets } = store;
    const signer = wallets?.getActiveSigner();
    const notificationStore = useNotificationStore();

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

    const ztgToReceive = useMemo(() => {
      if (market.marketType.categorical) {
        const balance = assetBalances?.get(signer?.address, assetId)?.data
          .balance;
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

        const priceRange = upperBound - lowerBound;
        const resolvedNumberAsPercentage =
          (resolvedNumber - lowerBound) / priceRange;

        const longTokenValue = resolvedNumberAsPercentage;
        const shortTokenValue = 1 - resolvedNumberAsPercentage;

        const longRewards = new Decimal(longBalance.free.toString())
          .div(ZTG)
          .mul(longTokenValue);

        const shortRewards = new Decimal(shortBalance.free.toString())
          .div(ZTG)
          .mul(shortTokenValue);

        return longRewards.add(shortRewards).div(ZTG);
      }
    }, [market, assetId, ...assetBalances.query.map((q) => q.data)]);

    const handleClick = async () => {
      if (!isRpcSdk(sdk)) return;

      const callback = extrinsicCallback({
        notificationStore,
        successCallback: async () => {
          notificationStore.pushNotification(
            `Redeemed ${ztgToReceive.toFixed(2)}${store.config.tokenSymbol}`,
            {
              type: "Success",
            },
          );
          assetBalances?.query.forEach((q) => q.refetch());
        },
        failCallback: ({ index, error }) => {
          notificationStore.pushNotification(
            store.getTransactionError(index, error),
            {
              type: "Error",
            },
          );
        },
      });

      const tx = sdk.context.api.tx.predictionMarkets.redeemShares(
        market.marketId,
      );

      await signAndSend(tx, signer, callback);
    };
    return (
      <div className="w-full flex items-center justify-center">
        <button
          onClick={handleClick}
          disabled={
            ztgToReceive == null ||
            ztgToReceive.equals(0) ||
            wallets.activeAccount == null
          }
          className="rounded-full h-ztg-20  text-ztg-10-150 focus:outline-none px-ztg-15 
              py-ztg-2 ml-auto bg-ztg-blue text-white disabled:opacity-20 disabled:cursor-default"
        >
          Redeem Tokens ({ztgToReceive?.toFixed(2)})
        </button>
        ({ztgToReceive?.toFixed(2)})
      </div>
    );
  },
);

export default RedeemButton;
