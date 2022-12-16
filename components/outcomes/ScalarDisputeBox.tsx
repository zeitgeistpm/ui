import { OutcomeReport } from "@zeitgeistpm/sdk/dist/types";
import { AmountInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import { ZTG } from "lib/constants";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import { useState } from "react";

const ScalarDisputeBox = observer(
  ({
    marketStore,
    onDispute,
  }: {
    marketStore: MarketStore;
    onDispute: () => void;
  }) => {
    const store = useStore();
    const notificationStore = useNotificationStore();
    const [scalarReportValue, setScalarReportValue] = useState("");

    const disputeBond = store.config.markets.disputeBond;
    const disputeFactor = store.config.markets.disputeFactor;
    const tokenSymbol = store.config.tokenSymbol;

    const { disputes } = marketStore;
    const bondAmount = disputes
      ? disputeBond + disputes.length * disputeFactor
      : disputeBond;

    const handleSignTransaction = async () => {
      const { market } = marketStore;
      const outcomeReport: OutcomeReport = {
        scalar: Number(scalarReportValue) * ZTG,
      };

      const signer = store.wallets.getActiveSigner();
      await market.dispute(
        signer,
        outcomeReport,
        extrinsicCallback({
          notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification("Outcome Disputed", {
              type: "Success",
            });
            await marketStore.refetchMarketData();
            onDispute();
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
      <>
        <div className="font-lato text-ztg-10-150 mb-ztg-5">
          Bond will start at {disputeBond} {tokenSymbol}, increasing by{" "}
          {disputeFactor} {tokenSymbol} for each dispute
        </div>
        <AmountInput
          value={scalarReportValue}
          min={marketStore.bounds?.[0].toString()}
          max={marketStore.bounds?.[1].toString()}
          onChange={(val) => setScalarReportValue(val)}
          showErrorMessage={false}
        />
        <div className="my-ztg-10">
          <div className="font-lato h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold text-sky-600">
            <span>Previous Report:</span>
            <span className="font-mono">
              {
                //@ts-ignore
                marketStore.lastDispute?.outcome.scalar ??
                  marketStore.reportedScalarOutcome
              }
            </span>
          </div>
          {bondAmount !== disputeBond && bondAmount !== undefined ? (
            <div className="font-lato h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold text-sky-600 ">
              <span>Previous Bond:</span>
              <span className="font-mono">{bondAmount - disputeFactor}</span>
            </div>
          ) : (
            <></>
          )}
        </div>

        <TransactionButton
          className="my-ztg-10 shadow-ztg-2"
          onClick={handleSignTransaction}
        >
          Dispute Outcome
        </TransactionButton>
      </>
    );
  },
);

export default ScalarDisputeBox;
