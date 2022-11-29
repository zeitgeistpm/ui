import { useAtom } from "jotai";
import { ZTG } from "lib/constants";
import { useTradeslipItems } from "lib/state/tradeslip/items";
import { slippagePercentageAtom } from "lib/state/tradeslip/slippage";
import { useTradeSlipState } from "lib/state/tradeslip/state";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { tradeSlipForm } from "lib/stores/TradeSlipStore";
import { observer } from "mobx-react";
import SlippageSettingInput from "../markets/SlippageInput";
import TransactionButton from "../ui/TransactionButton";
import TradeSlipItemList from "./TradeSlipItemList";

const TradeSlip = observer(() => {
  const store = useStore();
  const notificationStore = useNotificationStore();

  const tradeslipItems = useTradeslipItems();
  const tradeSlipState = useTradeSlipState();
  const [slippage, setSlippage] = useAtom(slippagePercentageAtom);

  const total = tradeSlipState.total.div(ZTG);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TradeSlipItemList items={tradeslipItems} state={tradeSlipState} />
      <div className="p-ztg-28 mt-auto">
        <div className="p-ztg-15 rounded-ztg-10 bg-white dark:bg-sky-1000">
          <TransactionButton
            className="shadow-ztg-2 mb-ztg-16"
            onClick={() => {}}
            disabled={true}
          >
            Sign Transactions
          </TransactionButton>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Slippage Tolerance:</div>
            <SlippageSettingInput
              value={slippage.toString()}
              onChange={(val) => setSlippage(Number(val))}
              form={tradeSlipForm}
            />
          </div>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Network fee:</div>
            <div className="font-normal">
              {tradeSlipState.transactionFees.div(ZTG).toFixed(4)}
            </div>
          </div>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Total cost / gain:</div>
            <div className="font-normal">
              {total.isNaN() ? "-- " : total.toFixed(2).toString()}{" "}
              {store.config?.tokenSymbol}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// const processTransactions = useCallback(async () => {
//   let failedItemId: number | null = null;
//   const { signer } = wallets.getActiveSigner() as ExtSigner;
//   return new Promise<void>(async (resolve, reject) => {
//     try {
//       const unsub = await batchTx.signAndSend(
//         wallets.activeAccount.address,
//         { signer },
//         extrinsicCallback({
//           notificationStore,
//           successCallback: () => {
//             let message = "All trades suceeded";
//             if (failedItemId == null) {
//               tradeSlipStore.clearItems();
//             } else {
//               // copy sorted array, the wone thet won't change when items are
//               // removed
//               const sortedItems = [...tradeSlipStore.sortedTrades];
//               const indexesToRemove: number[] = [];
//               for (const sortedId of Array.from(sortedItems.keys())) {
//                 if (sortedId < failedItemId) {
//                   const itemFromSorted = sortedItems[sortedId];
//                   const itemId = tradeSlipStore.findIndexWithAssetId(
//                     itemFromSorted.assetId,
//                   );
//                   indexesToRemove.push(itemId);
//                 }
//               }
//               tradeSlipStore.removeItemsAtIndexes(indexesToRemove, true);
//               message = "Some trades failed left in tradeslip";
//             }
//             notificationStore.pushNotification(message, {
//               type: "Success",
//             });
//             unsub();
//             resolve();
//           },
//           failCallback: ({ index, error }, batchIdx?: number) => {
//             const { errorName } = store.sdk.errorTable.getEntry(
//               index,
//               extractIndexFromErrorHex(error),
//             );
//             if (batchIdx != null) {
//               failedItemId = batchIdx;
//               const item = tradeSlipStore.tradeSlipItems[batchIdx];
//               notificationStore.pushNotification(
//                 `Trade failed: ${errorName} - ${item.assetTicker}`,
//                 {
//                   type: "Error",
//                 },
//               );
//             } else {
//               notificationStore.pushNotification(
//                 `Transaction failed. Error: ${errorName}`,
//                 {
//                   type: "Error",
//                 },
//               );
//             }
//             reject();
//             unsub();
//           },
//         }),
//       );
//     } catch (err) {
//       console.log("Transaction canceled", err.toString());
//       reject();
//     }
//   });
// }, [batchTx]);

export default TradeSlip;
