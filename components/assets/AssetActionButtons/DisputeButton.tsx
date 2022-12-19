import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import MarketStore from "lib/stores/MarketStore";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import { useMemo } from "react";

const DisputeButton = observer(
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

    const disputeDisabled = useMemo(() => {
      if (!wallets.activeAccount) return true;
      if (marketStore.type === "scalar") return false;
      if (marketStore.numDisputes === 0) {
        return (
          JSON.stringify(marketStore.reportedOutcome.asset) ===
          JSON.stringify(assetId)
        );
      } else {
        const disputedOutcome = marketStore.lastDispute.outcome;
        return (
          //@ts-ignore
          disputedOutcome.categorical === assetId.categoricalOutcome[1]
        );
      }
    }, [
      marketStore.numDisputes,
      assetId,
      marketStore.disputes,
      marketStore.lastDispute,
      wallets.activeAccount,
    ]);

    const handleClick = async () => {
      if (marketStore.type === "scalar") {
        modalStore.openModal(
          <div>
            <ScalarDisputeBox marketStore={marketStore} onDispute={() => {}} />
          </div>,
          "Dispute outcome",
        );
      } else {
        //@ts-ignore
        const ID = assetId.categoricalOutcome[1];
        const signer = wallets.getActiveSigner();
        const { market } = marketStore;

        await market.dispute(
          signer,
          { categorical: ID },
          extrinsicCallback({
            notificationStore,
            successCallback: async () => {
              notificationStore.pushNotification(
                `Disputed reported outcome with ${ticker}`,
                {
                  type: "Success",
                },
              );
              await marketStore.refetchMarketData();
              modalStore.closeModal();
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
      }
    };
    return (
      <div className="w-full flex items-center justify-center">
        <button
          onClick={handleClick}
          disabled={disputeDisabled}
          className="rounded-full h-ztg-20 font-space text-ztg-10-150 focus:outline-none px-ztg-15 py-ztg-2 ml-auto bg-dark-yellow text-white disabled:opacity-20 disabled:cursor-default"
        >
          Dispute Outcome
        </button>
      </div>
    );
  },
);

export default DisputeButton;
