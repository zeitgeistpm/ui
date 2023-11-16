import { Dialog } from "@headlessui/react";
import {
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  IOCategoricalAssetId,
  isRpcSdk,
  Market,
  ScalarAssetId,
} from "@zeitgeistpm/sdk";
import ScalarReportBox from "components/outcomes/ScalarReportBox";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
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

  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;
      if (!IOCategoricalAssetId.is(assetId)) return;

      const ID = assetId.CategoricalOutcome[1];

      return sdk.api.tx.predictionMarkets.report(market.marketId, {
        Categorical: ID,
      });
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          `Reported market outcome: ${outcomeName}`,
          {
            type: "Success",
          },
        );
      },
    },
  );

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
    isLoading ||
    isSuccess ||
    (stage.type === "OracleReportingPeriod" && !connectedWalletIsOracle);

  const handleClick = async () => {
    if (!isRpcSdk(sdk)) return;

    if (market.marketType.scalar) {
      setScalarReportBoxOpen(true);
    } else {
      send();
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
        <Dialog.Panel className="rounded-ztg-10 bg-white p-[15px]">
          <div className="min-w-[380px]">
            <div className="mb-2 text-base font-bold text-black">
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
