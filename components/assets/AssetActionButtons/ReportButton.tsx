import { Dialog } from "@headlessui/react";
import {
  AssetId,
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  IOCategoricalAssetId,
  IOMarketOutcomeAssetId,
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
import { isCombinatorialToken } from "lib/types/combinatorial";

const ReportButton = ({
  market,
  assetId,
}: {
  market: Market<IndexerContext>;
  assetId?: AssetId;
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const notificationStore = useNotifications();
  const [scalarReportBoxOpen, setScalarReportBoxOpen] = useState(false);

  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;

      let outcomeIndex: number | undefined;

      if (IOCategoricalAssetId.is(assetId)) {
        outcomeIndex = assetId.CategoricalOutcome[1];
      } else if (isCombinatorialToken(assetId)) {
        // For combinatorial tokens, find the index in the market's outcome assets
        const tokenHash = assetId.CombinatorialToken;
        const index = market.outcomeAssets?.findIndex((outcomeAsset) =>
          outcomeAsset.includes(tokenHash),
        );
        if (index !== undefined && index >= 0) {
          outcomeIndex = index;
        }
      }

      if (outcomeIndex === undefined) return;

      return sdk.api.tx.predictionMarkets.report(market.marketId, {
        Categorical: outcomeIndex,
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

  // Get outcome name based on asset type
  let outcomeName = "";
  if (assetId) {
    if (IOMarketOutcomeAssetId.is(assetId)) {
      outcomeName = market.categories?.[getIndexOf(assetId)]?.name || "";
    } else if (isCombinatorialToken(assetId)) {
      // For combinatorial tokens in multi-market positions, find the outcome by matching the token
      const tokenHash = assetId.CombinatorialToken;
      const index = market.outcomeAssets?.findIndex((outcomeAsset) =>
        outcomeAsset.includes(tokenHash),
      );
      if (index !== undefined && index >= 0) {
        outcomeName = market.categories?.[index]?.name || "";
      }
    }
  }

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
