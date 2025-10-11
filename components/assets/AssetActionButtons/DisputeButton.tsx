import { Dialog } from "@headlessui/react";
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
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isCombinatorialToken } from "lib/types/combinatorial";

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
        <Dialog.Panel className="w-full max-w-[564px] rounded-[10px] bg-white">
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
        </Dialog.Panel>
      </Modal>
    </>
  );
};

export default DisputeButton;
