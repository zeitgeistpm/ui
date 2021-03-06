import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import ScalarReportBox from "components/outcomes/ScalarReportBox";
import MarketStore from "lib/stores/MarketStore";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import { useMemo } from "react";

const ReportButton = observer(
  ({
    marketStore,
    assetId,
    ticker,
  }: {
    marketStore: MarketStore;
    assetId: AssetId;
    ticker: string;
  }) => {
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const modalStore = useModalStore();

    const reportDisabled = useMemo<boolean>(() => {
      if (!wallets.activeAccount) return true;

      if (marketStore.inReportPeriod) {
        return !(
          (marketStore.inOracleReportPeriod && marketStore.isOracle) ||
          !marketStore.inOracleReportPeriod
        );
      }
      return true;
    }, [
      marketStore.isOracle,
      marketStore.inReportPeriod,
      marketStore.inOracleReportPeriod,
      wallets.activeAccount,
    ]);

    const handleClick = async () => {
      if (marketStore.type === "scalar") {
        modalStore.openModal(
          <div>
            <ScalarReportBox marketStore={marketStore} onReport={() => {}} />
          </div>,
          "Report outcome"
        );
      } else {
        //@ts-ignore
        const ID = assetId.categoricalOutcome[1];
        const signer = wallets.getActiveSigner();
        const { market } = marketStore;

        await market.reportOutcome(
          signer,
          { categorical: ID },
          extrinsicCallback({
            notificationStore,
            successCallback: async () => {
              notificationStore.pushNotification(
                `Reported market outcome: ${ticker}`,
                {
                  type: "Success",
                }
              );
              await marketStore.refetchMarketData();
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
      }
    };

    return (
      <div className="w-full flex items-center justify-center">
        <button
          onClick={handleClick}
          disabled={reportDisabled}
          className="rounded-full h-ztg-20 font-kanit text-ztg-10-150 focus:outline-none border-2 px-ztg-15 ml-auto disabled:opacity-20 disabled:cursor-default"
        >
          Report Outcome
        </button>
      </div>
    );
  }
);

export default ReportButton;
