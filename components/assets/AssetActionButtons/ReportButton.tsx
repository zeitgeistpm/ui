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
import { ModalPanel, ModalBody } from "components/ui/ModalPanel";
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { useState } from "react";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { MdClose } from "react-icons/md";

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
        <ModalPanel size="md" className="bg-ztg-primary-900/85 border-ztg-primary-200/20">
          <div className="relative flex-shrink-0 border-b-2 border-white/10 px-6 pt-6 pb-3">
            <h2 className="text-center text-lg font-bold text-white md:text-xl">
              Report Outcome
            </h2>
            <button
              onClick={() => setScalarReportBoxOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white/10 bg-white/10 text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <MdClose size={20} />
            </button>
          </div>
          <ModalBody>
            <ScalarReportBox market={market} />
          </ModalBody>
        </ModalPanel>
      </Modal>
    </>
  );
};

export default ReportButton;
