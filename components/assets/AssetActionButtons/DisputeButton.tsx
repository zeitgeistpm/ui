import {
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  MarketOutcomeAssetId,
} from "@zeitgeistpm/sdk-next";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import {
  marketDisputesRootKey,
  useMarketDisputes,
} from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotifications } from "lib/state/notifications";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

const DisputeButton = observer(
  ({
    market,
    assetId,
  }: {
    market: Market<IndexerContext>;
    assetId: MarketOutcomeAssetId;
  }) => {
    const [sdk, id] = useSdkv2();
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotifications();
    const modalStore = useModalStore();
    const queryClient = useQueryClient();
    const assetIndex = getIndexOf(assetId);

    const ticker = market.categories?.[assetIndex].ticker;

    const { data: disputes } = useMarketDisputes(market);

    const disputeDisabled = useMemo(() => {
      const assetAlreadyReported =
        market.marketType.categorical &&
        market.report.outcome.categorical === assetIndex;

      return (sdk && !isRpcSdk(sdk)) || assetAlreadyReported;
    }, [sdk, disputes?.length, market, assetIndex]);

    const handleClick = async () => {
      if (market.marketType.scalar) {
        modalStore.openModal(
          <div>
            <ScalarDisputeBox market={market} />
          </div>,
          <>"Dispute outcome",</>,
        );
      } else if (isRpcSdk(sdk)) {
        const ID = getIndexOf(assetId);
        const signer = wallets.getActiveSigner();

        const callback = extrinsicCallback({
          notifications: notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification(
              `Disputed reported outcome with ${ticker}`,
              {
                type: "Success",
              },
            );
            queryClient.invalidateQueries([
              id,
              marketDisputesRootKey,
              market.marketId,
            ]);
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

        const tx = sdk.api.tx.predictionMarkets.dispute(market.marketId, {
          Categorical: ID,
        });
        await signAndSend(tx, signer, callback);
      }
    };
    return (
      <button
        onClick={handleClick}
        disabled={disputeDisabled}
        className="text-mariner font-semibold text-ztg-14-120 disabled:opacity-50"
      >
        Dispute Outcome
      </button>
    );
  },
);

export default DisputeButton;
