import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

const RedeemBox = observer(
  ({
    marketStore,
    onRedeem,
  }: {
    marketStore: MarketStore;
    onRedeem: () => void;
  }) => {
    const notificationStore = useNotificationStore();
    const store = useStore();
    const { wallets } = store;
    const { activeAccount, getActiveSigner } = wallets;
    const [ztgToReceive, setZtgToReceive] = useState<Decimal>();

    useEffect(() => {
      const { market } = marketStore;
      if (market && wallets.activeAccount) {
        (async () => {
          const winningBalance = await marketStore.calcWinnings();
          setZtgToReceive(winningBalance);
        })();
      }
    }, [marketStore, activeAccount]);

    const handleSignTransaction = async () => {
      const signer = await getActiveSigner();
      const { market } = marketStore;
      await market.redeemShares(
        signer,
        extrinsicCallback({
          notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification("Shares Redeemed", {
              type: "Success",
            });
            onRedeem();
          },
          failCallback: ({ index, error }) => {
            notificationStore.pushNotification(
              store.getTransactionError(index, error),
              {
                type: "Error",
              }
            );
          },
        })
      );
    };
    return (
      <div className="p-ztg-15 rounded-ztg-10 text-sky-600 bg-white dark:bg-sky-1000">
        <div className="flex h-ztg-36 items-center mb-ztg-10">
          <div className="w-full">
            <div className="flex h-ztg-20">
              <div className="w-ztg-20 h-ztg-20 border-2 border-sky-600 rounded-full mr-ztg-8 bg-ztg-blue"></div>
              <div className="font-kanit text-base font-bold flex items-center text-black dark:text-white">
                Assets in {store.config.tokenSymbol}
              </div>
            </div>
          </div>
          <div className="flex-grow text-right font-mono text-ztg-12-150 text-sky-600">
            {ztgToReceive?.toFixed(3)}
          </div>
        </div>
        <TransactionButton
          className="mb-ztg-10 shadow-ztg-2"
          onClick={handleSignTransaction}
          disabled={ztgToReceive?.equals(0) || ztgToReceive == null}
        >
          Redeem {store.config.tokenSymbol}
        </TransactionButton>
      </div>
    );
  }
);

export default RedeemBox;
