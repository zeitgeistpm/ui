import {
  CategoricalAssetId,
  IndexerContext,
  isRpcSdk,
  Market,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import ScalarReportBox from "components/outcomes/ScalarReportBox";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";

const ReportButton = observer(
  ({
    market,
    assetId,
    ticker,
  }: {
    market: Market<IndexerContext>;
    assetId: ScalarAssetId | CategoricalAssetId;
    ticker: string;
  }) => {
    const [sdk] = useSdkv2();
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const modalStore = useModalStore();

    if (!market) return null;

    const reportDisabled = !sdk || !isRpcSdk(sdk);

    const handleClick = async () => {
      if (!isRpcSdk(sdk)) return;

      if (market.marketType.scalar) {
        modalStore.openModal(
          <div>
            <ScalarReportBox market={market} />
          </div>,
          "Report outcome",
        );
      } else {
        //@ts-ignore
        const ID = assetId.CategoricalOutcome[1];
        const signer = wallets.getActiveSigner();

        const callback = extrinsicCallback({
          notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification(
              `Reported market outcome: ${ticker}`,
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

        if (isRpcSdk(sdk)) {
          const tx = sdk.context.api.tx.predictionMarkets.report(
            market.marketId,
            { Categorical: ID },
          );
          signAndSend(tx, signer, callback);
        }
      }
    };

    return (
      <div className="w-full flex items-center justify-center">
        <button
          onClick={handleClick}
          disabled={reportDisabled}
          className="rounded-full h-ztg-20  text-ztg-10-150 focus:outline-none border-2 px-ztg-15 ml-auto disabled:opacity-20 disabled:cursor-default"
        >
          Report Outcome
        </button>
      </div>
    );
  },
);

export default ReportButton;
