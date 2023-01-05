import {
  AssetId,
  IndexerContext,
  isRpcSdk,
  Market,
} from "@zeitgeistpm/sdk-next";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useMemo } from "react";

const DisputeButton = observer(
  ({
    market,
    assetId,
    ticker,
  }: {
    market: Market<IndexerContext>;
    assetId: AssetId;
    ticker: string;
  }) => {
    const [sdk, id] = useSdkv2();
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const modalStore = useModalStore();

    const { data: disputes } = useMarketDisputes(market);

    const disputeDisabled = useMemo(() => {
      // TODO: fix this
      // if (!wallets.activeAccount) return true;
      // if (market.marketType.scalar) return false;
      // if (disputes?.length === 0) {
      //   return (
      //     JSON.stringify(market.report?.outcome) ===
      //     JSON.stringify(assetId)
      //   );
      // } else {
      //   const disputedOutcome = marketStore.lastDispute.outcome;
      //   return (
      //     //@ts-ignore
      //     disputedOutcome.categorical === assetId.categoricalOutcome[1]
      //   );
      // }
      return sdk && !isRpcSdk(sdk);
    }, [sdk, disputes.length]);

    const handleClick = async () => {
      if (market.marketType.scalar) {
        modalStore.openModal(
          <div>
            <ScalarDisputeBox market={market} />
          </div>,
          "Dispute outcome",
        );
      } else if (isRpcSdk(sdk)) {
        //@ts-ignore
        const ID = assetId.categoricalOutcome[1];
        const signer = wallets.getActiveSigner();

        const callback = extrinsicCallback({
          notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification(
              `Disputed reported outcome with ${ticker}`,
              {
                type: "Success",
              },
            );
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

        const tx = sdk.context.api.tx.predictionMarkets.dispute(
          market.marketId,
          { Categorical: ID },
        );
        await signAndSend(tx, signer, callback);
      }
    };
    return (
      <div className="w-full flex items-center justify-center">
        <button
          onClick={handleClick}
          disabled={disputeDisabled}
          className="rounded-full h-ztg-20  text-ztg-10-150 focus:outline-none px-ztg-15 py-ztg-2 ml-auto bg-dark-yellow text-white disabled:opacity-20 disabled:cursor-default"
        >
          Dispute Outcome
        </button>
      </div>
    );
  },
);

export default DisputeButton;
