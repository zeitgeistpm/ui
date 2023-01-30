import {
  AssetId,
  getIndexOf,
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
  }: {
    market: Market<IndexerContext>;
    assetId: AssetId;
  }) => {
    const [sdk, id] = useSdkv2();
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const modalStore = useModalStore();

    const ticker = market.categories?.[getIndexOf(assetId)];

    const { data: disputes } = useMarketDisputes(market);

    const disputeDisabled = useMemo(() => {
      return sdk && !isRpcSdk(sdk);
    }, [sdk, disputes?.length]);

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
        const ID = assetId.CategoricalOutcome[1];
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
      <button
        onClick={handleClick}
        disabled={disputeDisabled}
        className="text-blue-600 font-bold"
      >
        Dispute Outcome
      </button>
    );
  },
);

export default DisputeButton;
