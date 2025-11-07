import {
  AssetId,
  getIndexOf,
  IndexerContext,
  IOMarketOutcomeAssetId,
  isRpcSdk,
  Market,
} from "@zeitgeistpm/sdk";
import CategoricalDisputeBox from "components/outcomes/CategoricalDisputeBox";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import Modal from "components/ui/Modal";
import { ModalPanel, ModalBody } from "components/ui/ModalPanel";
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { MdClose } from "react-icons/md";

import { useMemo, useState } from "react";

const DisputeButton = ({
  market,
  assetId,
}: {
  market: Market<IndexerContext>;
  assetId?: AssetId;
}) => {
  const [sdk] = useSdkv2();

  const { data: disputes } = useMarketDisputes(market);

  const [isOpen, setOpen] = useState(false);

  const disputeDisabled = useMemo(() => {
    if (!assetId) return true;

    let assetIndex: number | undefined;

    if (IOMarketOutcomeAssetId.is(assetId)) {
      assetIndex = getIndexOf(assetId);
    } else if (isCombinatorialToken(assetId)) {
      // For combinatorial tokens, find the index in the market's outcome assets
      const tokenHash = assetId.CombinatorialToken;
      const index = market.outcomeAssets?.findIndex((outcomeAsset) =>
        outcomeAsset.includes(tokenHash),
      );
      if (index !== undefined && index >= 0) {
        assetIndex = index;
      }
    }

    if (assetIndex === undefined) return true;

    const isCategorical = market.marketType.categorical != null;
    const assetIsReported = market.report?.outcome?.categorical === assetIndex;

    return (sdk && !isRpcSdk(sdk)) || (isCategorical && assetIsReported);
  }, [sdk, disputes?.length, market, assetId]);

  return (
    <>
      <SecondaryButton onClick={() => setOpen(true)} disabled={disputeDisabled}>
        Dispute Outcome
      </SecondaryButton>

      <Modal open={isOpen} onClose={() => setOpen(false)}>
        <ModalPanel size="md" className="bg-ztg-primary-900/85 border-ztg-primary-200/20">
          <div className="relative flex-shrink-0 border-b-2 border-white/10 px-6 pt-6 pb-3">
            <h2 className="text-center text-lg font-bold text-white md:text-xl">
              Dispute Outcome
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white/10 bg-white/10 text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <MdClose size={20} />
            </button>
          </div>
          <ModalBody>
            {market.marketType.scalar ? (
              <ScalarDisputeBox
                market={market}
                onSuccess={() => setOpen(false)}
              />
            ) : (
              <CategoricalDisputeBox
                market={market}
                assetId={assetId}
                onSuccess={() => setOpen(false)}
              />
            )}
          </ModalBody>
        </ModalPanel>
      </Modal>
    </>
  );
};

export default DisputeButton;
