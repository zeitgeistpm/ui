import { Dialog } from "@headlessui/react";
import {
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  MarketOutcomeAssetId,
} from "@zeitgeistpm/sdk";
import CategoricalDisputeBox from "components/outcomes/CategoricalDisputeBox";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";

import { useMemo, useState } from "react";

const DisputeButton = ({
  market,
  assetId,
}: {
  market: Market<IndexerContext>;
  assetId?: MarketOutcomeAssetId;
}) => {
  const [sdk] = useSdkv2();

  const { data: disputes } = useMarketDisputes(market);

  const [isOpen, setOpen] = useState(false);

  const disputeDisabled = useMemo(() => {
    if (!assetId) return true;
    const assetIndex = getIndexOf(assetId);
    const isCategorical = market.marketType.categorical != null;
    const assetIsReported = market.report?.outcome?.categorical === assetIndex;

    return (sdk && !isRpcSdk(sdk)) || (isCategorical && assetIsReported);
  }, [sdk, disputes?.length, market]);

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
              assetId={assetId!}
              onSuccess={() => setOpen(false)}
            />
          )}
        </Dialog.Panel>
      </Modal>
    </>
  );
};

export default DisputeButton;
