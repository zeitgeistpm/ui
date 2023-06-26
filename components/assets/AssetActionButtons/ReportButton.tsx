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
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useState } from "react";

const ReportButton = ({
  market,
  assetId,
}: {
  market: Market<IndexerContext>;
  assetId?: ScalarAssetId | CategoricalAssetId;
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const notificationStore = useNotifications();
  const [scalarReportBoxOpen, setScalarReportBoxOpen] = useState(false);

  if (!market) return <></>;
  const { data: stage } = useMarketStage(market);

  const outcomeName = assetId
    ? market.categories?.[getIndexOf(assetId)]?.name
    : "";

  const connectedWalletIsOracle =
    market.oracle === wallet.activeAccount?.address;

  const reportDisabled =
    !isRpcSdk(sdk) ||
    !stage ||
    (stage.type === "OracleReportingPeriod" && !connectedWalletIsOracle);

  const handleClick = async () => {
    if (!isRpcSdk(sdk)) return;

    if (market.marketType.scalar) {
      setScalarReportBoxOpen(true);
    } else {
      //@ts-ignore
      const ID = assetId.CategoricalOutcome[1];
      const signer = wallet.getActiveSigner();
      if (!signer) return;

      const callback = extrinsicCallback({
        api: sdk.api,
        notifications: notificationStore,
        successCallback: async () => {
          notificationStore.pushNotification(
            `Reported market outcome: ${outcomeName}`,
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
      <SecondaryButton onClick={handleClick} disabled={reportDisabled}>
        Report Outcome
      </SecondaryButton>

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
};

export default ReportButton;
