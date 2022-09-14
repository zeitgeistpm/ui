import { OutcomeReport } from "@zeitgeistpm/sdk/dist/types";
import { AmountInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useState } from "react";

const ScalarReportBox = observer(
  ({
    marketStore,
    onReport,
  }: {
    marketStore: MarketStore;
    onReport: () => void;
  }) => {
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const [scalarReportValue, setScalarReportValue] = useState("");

    const handleNumberChange = (val: string) => {
      setScalarReportValue(val);
    };

    const reportDisabled = !marketStore.connectedWalletCanReport;

    const { isAuthorityProxy } = marketStore;

    const handleSignTransaction = async () => {
      const outcomeReport: OutcomeReport = {
        scalar: Number(scalarReportValue),
      };
      const signer = wallets.getActiveSigner();
      const { market } = marketStore;

      const callback = extrinsicCallback({
        notificationStore,
        successCallback: async () => {
          notificationStore.pushNotification("Outcome Reported", {
            type: "Success",
          });
          await marketStore.refetchMarketData();
          onReport();
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

      if (
        marketStore.disputeMechanism === "authorized" &&
        marketStore.status === "Disputed"
      ) {
        const tx = store.sdk.api.tx.authorized.authorizeMarketOutcome(
          market.marketId,
          outcomeReport,
        );
        if (isAuthorityProxy) {
          const proxyTx = store.sdk.api.tx.proxy.proxy(
            marketStore.authority,
            "Any",
            tx,
          );
          signAndSend(proxyTx, signer, callback);
        } else {
          signAndSend(tx, signer, callback);
        }
      } else {
        await market.reportOutcome(signer, outcomeReport, callback);
      }
    };
    return (
      <>
        <AmountInput
          value={scalarReportValue}
          min={marketStore.bounds?.[0].toString()}
          max={marketStore.bounds?.[1].toString()}
          onChange={handleNumberChange}
          showErrorMessage={false}
        />
        <TransactionButton
          className="my-ztg-10 shadow-ztg-2"
          onClick={handleSignTransaction}
          disabled={reportDisabled}
        >
          Report Outcome
        </TransactionButton>
      </>
    );
  },
);

export default ScalarReportBox;
