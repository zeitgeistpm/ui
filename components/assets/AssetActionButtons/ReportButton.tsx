import { Dialog } from "@headlessui/react";
import {
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import ScalarReportBox from "components/outcomes/ScalarReportBox";
import Modal from "components/ui/Modal";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useState } from "react";

const ReportButton = observer(
  ({
    market,
    assetId,
  }: {
    market: Market<IndexerContext>;
    assetId: ScalarAssetId | CategoricalAssetId;
  }) => {
    const [sdk] = useSdkv2();
    const wallet = useWallet();
    const notificationStore = useNotifications();
    const [scalarReportBoxOpen, setScalarReportBoxOpen] = useState(false);

    if (!market) return null;

    const ticker = market.categories?.[getIndexOf(assetId)].ticker;

    const reportDisabled = !sdk || !isRpcSdk(sdk);

    const handleClick = async () => {
      if (!isRpcSdk(sdk)) return;

      if (market.marketType.scalar) {
        setScalarReportBoxOpen(true);
      } else {
        //@ts-ignore
        const ID = assetId.CategoricalOutcome[1];
        const signer = wallet.getActiveSigner();

        const callback = extrinsicCallback({
          api: sdk.api,
          notifications: notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification(
              `Reported market outcome: ${ticker}`,
              {
                type: "Success",
              },
            );
          },
          failCallback: (error) => {
            notificationStore.pushNotification(error, {
              type: "Error",
            });
          },
        });

        if (isRpcSdk(sdk)) {
          const tx = sdk.api.tx.predictionMarkets.report(market.marketId, {
            Categorical: ID,
          });
          signAndSend(tx, signer, callback);
        }
      }
    };

    return (
      <>
        <button
          onClick={handleClick}
          disabled={reportDisabled}
          className="text-mariner font-semibold text-ztg-14-120"
        >
          Report Outcome
        </button>

        <Modal
          open={scalarReportBoxOpen}
          onClose={() => setScalarReportBoxOpen(false)}
        >
          <Dialog.Panel className="bg-white rounded-ztg-10 p-[15px]">
            <div>
              <div className="font-bold text-ztg-16-150 text-black">
                Report outcome
              </div>
              <ScalarReportBox market={market} />
            </div>
          </Dialog.Panel>
        </Modal>
      </>
    );
  },
);

export default ReportButton;
