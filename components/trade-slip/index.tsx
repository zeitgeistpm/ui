import React, { useCallback } from "react";
import Decimal from "decimal.js";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { when } from "mobx";
import { observer } from "mobx-react";
import { useStore } from "lib/stores/Store";
import { tradeSlipForm, useTradeSlipStore } from "lib/stores/TradeSlipStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { extrinsicCallback } from "lib/util/tx";

import TradeSlipItemList from "./TradeSlipItemList";
import TransactionButton from "../ui/TransactionButton";
import SlippageSettingInput from "../markets/SlippageInput";
import { extractIndexFromErrorHex } from "../../lib/util/error-table";

const TradeSlip = observer(() => {
  const tradeSlipStore = useTradeSlipStore();
  const notificationStore = useNotificationStore();
  const store = useStore();
  const { wallets } = store;
  const {
    itemsUpdating,
    batchTx,
    totalCost,
    txFee,
    insufficientZtg,
    txInProgress,
    setTxInProgress,
  } = tradeSlipStore;

  const processTransactions = useCallback(async () => {
    let failedItemId: number | null = null;
    const { signer } = wallets.getActiveSigner() as ExtSigner;
    return new Promise<void>(async (resolve, reject) => {
      try {
        const unsub = await batchTx.signAndSend(
          wallets.activeAccount.address,
          { signer },
          extrinsicCallback({
            notificationStore,
            successCallback: () => {
              let message = "All trades suceeded";
              if (failedItemId == null) {
                tradeSlipStore.clearItems();
              } else {
                // copy sorted array, the wone thet won't change when items are
                // removed
                const sortedItems = [...tradeSlipStore.sortedTrades];
                const indexesToRemove: number[] = [];
                for (const sortedId of Array.from(sortedItems.keys())) {
                  if (sortedId < failedItemId) {
                    const itemFromSorted = sortedItems[sortedId];
                    const itemId = tradeSlipStore.findIndexWithAssetId(
                      itemFromSorted.assetId,
                    );
                    indexesToRemove.push(itemId);
                  }
                }
                tradeSlipStore.removeItemsAtIndexes(indexesToRemove, true);
                message = "Some trades failed left in tradeslip";
              }
              notificationStore.pushNotification(message, {
                type: "Success",
              });
              unsub();
              resolve();
            },
            failCallback: ({ index, error }, batchIdx?: number) => {
              const { errorName } = store.sdk.errorTable.getEntry(
                index,
                extractIndexFromErrorHex(error),
              );
              if (batchIdx != null) {
                failedItemId = batchIdx;
                const item = tradeSlipStore.tradeSlipItems[batchIdx];
                notificationStore.pushNotification(
                  `Trade failed: ${errorName} - ${item.assetTicker}`,
                  {
                    type: "Error",
                  },
                );
              } else {
                notificationStore.pushNotification(
                  `Transaction failed. Error: ${errorName}`,
                  {
                    type: "Error",
                  },
                );
              }
              reject();
              unsub();
            },
          }),
        );
      } catch (err) {
        console.log("Transaction canceled", err.toString());
        reject();
      }
    });
  }, [batchTx]);

  const submitTransactions = async () => {
    if (itemsUpdating === true) {
      await when(() => !itemsUpdating);
    }
    tradeSlipForm.submit({
      onSuccess: async () => {
        if (tradeSlipForm.isValid) {
          setTxInProgress(true);
          try {
            await processTransactions();
          } catch {
            setTxInProgress(false);
          } finally {
            setTxInProgress(false);
          }
        }
      },
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TradeSlipItemList />
      <div className="p-ztg-28 mt-auto">
        <div className="p-ztg-15 rounded-ztg-10 bg-white dark:bg-sky-1000">
          <TransactionButton
            className="shadow-ztg-2 mb-ztg-16"
            onClick={() => {
              submitTransactions();
            }}
            disabled={
              !tradeSlipForm.isValid ||
              batchTx == null ||
              txInProgress ||
              insufficientZtg
            }
          >
            Sign Transactions
          </TransactionButton>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Slippage Tolerance:</div>
            <SlippageSettingInput
              value={tradeSlipStore.slippagePercentage?.toFixed(1)}
              onChange={(val) => tradeSlipStore.setSlippagePercentage(val)}
              form={tradeSlipForm}
            />
          </div>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Network fee:</div>
            <div className="font-normal">
              {txFee.toFixed(4)} {store.config?.tokenSymbol}
            </div>
          </div>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Total cost / gain:</div>
            <div className="font-normal">
              {totalCost.isNaN()
                ? "---"
                : totalCost.mul(-1).toFixed(4, Decimal.ROUND_DOWN)}{" "}
              {store.config?.tokenSymbol}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TradeSlip;
