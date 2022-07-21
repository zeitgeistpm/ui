import { AmountInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useMarketsStore } from "lib/stores/MarketsStore";
import MarketStore from "lib/stores/MarketStore";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";

const SellFullSetModal = observer(
  ({ marketStore }: { marketStore: MarketStore }) => {
    const store = useStore();
    const { wallets } = store;
    const modalStore = useModalStore();
    const marketsStore = useMarketsStore();
    const notificationStore = useNotificationStore();
    const [amount, setAmount] = useState<string>("0");
    const [maxTokenSet, setMaxTokenSet] = useState<Decimal>(new Decimal(0));

    const assets = marketStore.marketOutcomes.filter(
      (outcome) => outcome.metadata !== "ztg"
    );

    useEffect(() => {
      let lowestTokenAmount: Decimal;
      marketStore.marketOutcomes.forEach(async (outcome) => {
        if (outcome.metadata !== "ztg") {
          const balance = await store.getBalance(outcome.asset);
          if (
            lowestTokenAmount == null ||
            balance.lessThan(lowestTokenAmount)
          ) {
            lowestTokenAmount = balance;
          }
        }
        setMaxTokenSet(lowestTokenAmount ?? new Decimal(0));
      });
    }, [marketStore]);

    const handleAmountChange = (amount: string) => {
      setAmount(amount);
    };

    const handleSignTransaction = async () => {
      if (Number(amount) > maxTokenSet.toNumber() || Number(amount) === 0)
        return;
      const signer = wallets.getActiveSigner();

      await marketStore.market.sellCompleteSet(
        signer,
        new Decimal(amount).mul(ZTG).toNumber(),
        extrinsicCallback({
          notificationStore,
          successCallback: () => {
            notificationStore.pushNotification(
              `Sold ${new Decimal(amount).toFixed(1)} full sets`,
              { type: "Success" }
            );
            modalStore.closeModal();
            marketsStore.getMarket(marketStore.id);
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

    useEffect(() => {
      modalStore.setOnEnterKeyPress(() => handleSignTransaction());
    }, [modalStore, handleSignTransaction]);

    return (
      <div>
        <div>
          <div className="flex items-center mt-ztg-24 mb-ztg-8">
            {assets.map((outcome, index) => (
              <div
                key={index}
                className="rounded-full w-ztg-20 h-ztg-20 -mr-ztg-8 border-sky-600 border-2"
                style={{ backgroundColor: outcome.metadata["color"] }}
              ></div>
            ))}
            <div className="font-bold font-space ml-ztg-20  text-ztg-16-150 text-black dark:text-white">
              Full Set
            </div>
            <span className="font-mono text-ztg-12-150 font-medium ml-auto ">
              {maxTokenSet.toString()}
            </span>
          </div>
          <AmountInput value={amount} onChange={handleAmountChange} min="0" />
        </div>
        <div>
          <div className="flex items-center mt-ztg-24 mb-ztg-8">
            <div className="rounded-full w-ztg-20 h-ztg-20 mr-ztg-10 border-sky-600 border-2 bg-ztg-blue"></div>
            <div className="font-bold font-space  text-ztg-16-150 uppercase text-black dark:text-white">
              {store.config.tokenSymbol}
            </div>
            <span className="font-mono text-ztg-12-150 font-medium ml-auto text-sky-600">
              {wallets.activeBalance.toNumber()}
            </span>
          </div>
          <AmountInput
            value={amount}
            onChange={handleAmountChange}
            disabled={true}
            min="0"
          />
        </div>
        <div className="h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 my-ztg-10 text-sky-600">
          <span className="font-lato font-bold">Price per Set:</span>
          <span className="font-mono font-medium">
            1 {store.config.tokenSymbol}
          </span>
        </div>
        <TransactionButton
          className="!rounded-ztg-10 h-ztg-50"
          onClick={handleSignTransaction}
          disabled={
            Number(amount) > maxTokenSet.toNumber() || Number(amount) === 0
          }
        >
          Sign Transaction
        </TransactionButton>
      </div>
    );
  }
);

export default SellFullSetModal;
