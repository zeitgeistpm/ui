import { useAtom } from "jotai";
import { ZTG } from "lib/constants";
import { useTradeslipItems } from "lib/state/tradeslip/items";
import { slippagePercentageAtom } from "lib/state/tradeslip/slippage";
import { useTradeSlipState } from "lib/state/tradeslip/state";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { tradeSlipForm } from "lib/stores/TradeSlipStore";
import { observer } from "mobx-react";
import { finalize } from "rxjs";
import SlippageSettingInput from "../markets/SlippageInput";
import TransactionButton from "../ui/TransactionButton";
import TradeSlipItemList from "./TradeSlipItemList";

const TradeSlip = observer(() => {
  const store = useStore();
  const notificationStore = useNotificationStore();

  const tradeslipItems = useTradeslipItems();
  const tradeSlipState = useTradeSlipState();
  const [slippage, setSlippage] = useAtom(slippagePercentageAtom);

  const fees = tradeSlipState.transactionFees.div(ZTG);
  const total = tradeSlipState.total.div(ZTG);

  const onSubmit = () => {
    if (tradeSlipState.transaction) {
      const { signer } = store.wallets.getActiveSigner() as any;
      tradeSlipState.transaction.signAndSend(
        store.wallets.activeAccount.address,
        { signer },
        (result) => {
          if (result.isFinalized) {
            console.log("finalized");
          }
        },
      );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TradeSlipItemList items={tradeslipItems} state={tradeSlipState} />
      <div className="p-ztg-28 mt-auto">
        <div className="p-ztg-15 rounded-ztg-10 bg-white dark:bg-sky-1000">
          <TransactionButton
            className="shadow-ztg-2 mb-ztg-16"
            onClick={onSubmit}
            disabled={false}
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
            <div className="font-normal">{fees.toFixed(4)}</div>
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
//
//       );
//     } catch (err) {
//       console.log("Transaction canceled", err.toString());
//       reject();
//     }
//   });
// }, [batchTx]);

export default TradeSlip;
