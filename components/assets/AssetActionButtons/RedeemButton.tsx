import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

const RedeemButton = observer(
  ({
    marketStore,
    assetId,
  }: {
    marketStore: MarketStore;
    assetId: AssetId;
  }) => {
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const [ztgToReceive, setZtgToReceive] = useState<Decimal>();

    useEffect(() => {
      (async () => {
        const winningBalance = await marketStore.calcWinnings();
        setZtgToReceive(winningBalance);
      })();
    }, [marketStore]);

    const handleClick = async () => {
      const signer = wallets.getActiveSigner();
      const { market } = marketStore;
      await market.redeemShares(
        signer,
        extrinsicCallback({
          notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification(
              `Redeemed ${ztgToReceive.toFixed(2)}${store.config.tokenSymbol}`,
              {
                type: "Success",
              },
            );
            setZtgToReceive(new Decimal(0));
          },
          failCallback: ({ index, error }) => {
            notificationStore.pushNotification(
              store.getTransactionError(index, error),
              {
                type: "Error",
              },
            );
          },
        }),
      );
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
          Redeem Tokens
        </button>
      </div>
    );
  },
);

export default RedeemButton;
