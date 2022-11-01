import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

interface MarketBalance {
  balance: Decimal;
  marketStore: MarketStore;
}

const RedeemAllButton = observer(
  ({
    marketStores,
    onSuccess,
  }: {
    marketStores: MarketStore[];
    onSuccess: () => void;
  }) => {
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const [totalWinnings, setTotalWinnings] = useState<number>(0);
    const [balances, setBalances] = useState<MarketBalance[]>([]);

    useEffect(() => {
      if (!marketStores) return;
      (async () => {
        const winningBalances: MarketBalance[] = await Promise.all(
          marketStores
            .filter((m) => m.status === "Resolved")
            .map(async (marketStore) => {
              return {
                balance: await marketStore.calcWinnings(),
                marketStore: marketStore,
              };
            }),
        );

        setBalances(winningBalances);
        const total = winningBalances.reduce(
          (total, balance) => total + (balance?.balance?.toNumber() ?? 0),
          0,
        );

        setTotalWinnings(total);
      })();
    }, [marketStores]);

    const handleClick = () => {
      const signer = wallets.getActiveSigner() as ExtSigner;

      const transactions = [];

      balances.forEach((balance) => {
        if (balance?.balance) {
          transactions.push(
            store.sdk.api.tx.predictionMarkets.redeemShares(
              balance.marketStore.id,
            ),
          );
        }
      });

      const tx = store.sdk.api.tx.utility.batchAll(transactions);
      signAndSend(
        tx,
        signer,
        extrinsicCallback({
          notificationStore,
          successCallback: () => {
            //todo: swap token symbol with config when available
            notificationStore.pushNotification(`Claimed ${totalWinnings} ZTG`, {
              type: "Success",
            });
            setTotalWinnings(0);
            onSuccess();
          },
          failCallback: ({ index, error }) => {
            notificationStore.pushNotification(
              store.getTransactionError(index, error),
              { type: "Error" },
            );
          },
        }),
      );
    };
    return (
      <>
        {totalWinnings > 0 ? (
          <button
            onClick={handleClick}
            className="text-ztg-12-150 font-medium text-white px-ztg-35 h-ztg-32 bg-ztg-blue rounded-ztg-100 cursor-pointer disabled:cursor-default disabled:opacity-20 focus:outline-none"
          >
            Redeem All Tokens (
            {`${totalWinnings.toFixed(0)} ${store.config.tokenSymbol}`})
          </button>
        ) : (
          <></>
        )}
      </>
    );
  },
);

export default RedeemAllButton;
