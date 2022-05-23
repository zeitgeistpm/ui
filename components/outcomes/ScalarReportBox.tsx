import { OutcomeReport } from "@zeitgeistpm/sdk/dist/types";
import { AmountInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import { useMemo, useState } from "react";

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

    const reportDisabled = useMemo<boolean>(() => {
      if (marketStore.inReportPeriod) {
        return !(
          (marketStore.inOracleReportPeriod && marketStore.isOracle) ||
          !marketStore.inOracleReportPeriod
        );
      }
      return true;
    }, [
      marketStore.inReportPeriod,
      marketStore.inOracleReportPeriod,
      wallets.activeAccount.address,
      store.blockNumber,
    ]);
    const handleSignTransaction = async () => {
      const outcomeReport: OutcomeReport = {
        scalar: Number(scalarReportValue),
      };
      const signer = wallets.getActiveSigner();
      const { market } = marketStore;

      await market.reportOutcome(
        signer,
        outcomeReport,
        extrinsicCallback({
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
              }
            );
          },
        })
      );
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
  }
);

export default ScalarReportBox;
