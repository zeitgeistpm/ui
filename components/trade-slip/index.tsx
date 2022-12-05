import Decimal from "decimal.js";
import { useAtom } from "jotai";
import { ZTG } from "lib/constants";
import { useTradeslipItems } from "lib/state/tradeslip/items";
import { slippagePercentageAtom } from "lib/state/tradeslip/slippage";
import { useTradeslipTotalState } from "lib/state/tradeslip/tradeslipTotalState";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useCallback, useState } from "react";
import SlippageSettingInput from "../markets/SlippageInput";
import TransactionButton from "../ui/TransactionButton";
import TradeSlipItem from "./TradeSlipItem";

const TradeSlip = observer(() => {
  const store = useStore();
  const notificationStore = useNotificationStore();

  const tradeslipItems = useTradeslipItems();
  const [slippage, setSlippage] = useAtom(slippagePercentageAtom);

  const { sum } = useTradeslipTotalState();
  const fees = new Decimal(0); //tradeSlipState.transactionFees.div(ZTG);

  const [isTransacting, setIsTransacting] = useState(false);

  const onSubmit = async () => {
    // if (!isTransacting && tradeSlipState.transaction) {
    //   try {
    //     setIsTransacting(true);
    //     await processTransactions();
    //   } catch (error) {
    //     console.error(error);
    //   }
    //   setIsTransacting(false);
    // }
  };

  const processTransactions = useCallback(async () => {
    // let failedItemId: number | null = null;
    // const { signer } = store.wallets.getActiveSigner() as ExtSigner;
    // return new Promise<void>(async (resolve, reject) => {
    //   try {
    //     const unsub = await tradeSlipState.transaction.signAndSend(
    //       store.wallets.activeAccount.address,
    //       { signer },
    //       extrinsicCallback({
    //         notificationStore,
    //         successCallback: () => {
    //           let message = "All trades suceeded";
    //           if (failedItemId == null) {
    //             tradeslipItems.clear();
    //           } else {
    //             tradeslipItems.slice(failedItemId);
    //             message = "Some trades failed left in tradeslip";
    //           }
    //           notificationStore.pushNotification(message, {
    //             type: "Success",
    //           });
    //           unsub();
    //           resolve();
    //         },
    //         failCallback: ({ index, error }, batchIdx?: number) => {
    //           const { errorName } = store.sdk.errorTable.getEntry(
    //             index,
    //             extractIndexFromErrorHex(error),
    //           );
    //           if (batchIdx != null) {
    //             failedItemId = batchIdx;
    //             const item = tradeslipItems.items[batchIdx];
    //             const data = tradeSlipState.get(item);
    //             notificationStore.pushNotification(
    //               `Trade failed: ${errorName} - ${data?.asset.category.ticker}`,
    //               {
    //                 type: "Error",
    //               },
    //             );
    //           } else {
    //             notificationStore.pushNotification(
    //               `Transaction failed. Error: ${errorName}`,
    //               {
    //                 type: "Error",
    //               },
    //             );
    //           }
    //           reject();
    //           unsub();
    //         },
    //       }),
    //     );
    //   } catch (err) {
    //     console.log("Transaction canceled", err.toString());
    //     reject();
    //   }
    // });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="py-ztg-20 px-ztg-28 overflow-y-auto w-full">
        {tradeslipItems.items.map((item) => {
          return (
            <TradeSlipItem
              key={`${item.action}|${JSON.stringify(item.assetId)}`}
              item={item}
            />
          );
        })}
      </div>

      <div className="p-ztg-28 mt-auto">
        <div className="p-ztg-15 rounded-ztg-10 bg-white dark:bg-sky-1000">
          <TransactionButton
            className="shadow-ztg-2 mb-ztg-16"
            onClick={onSubmit}
            disabled={isTransacting || tradeslipItems.items.length === 0}
          >
            Sign Transactions
          </TransactionButton>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Slippage Tolerance:</div>
            <SlippageSettingInput
              value={slippage.toString()}
              onChange={(val) => setSlippage(Number(val))}
            />
          </div>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Network fee:</div>
            <div className="font-normal">{fees.toFixed(4)}</div>
          </div>
          <div className="flex items-center h-ztg-25 text-sky-600 font-lato text-ztg-12-150 justify-between">
            <div className="font-bold">Total cost / gain:</div>
            <div className="font-normal">
              {sum.isNaN() ? "-- " : sum.div(ZTG).toFixed(2).toString()}{" "}
              {store.config?.tokenSymbol}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TradeSlip;
