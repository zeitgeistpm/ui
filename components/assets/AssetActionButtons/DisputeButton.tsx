import { Dialog } from "@headlessui/react";
import {
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  MarketOutcomeAssetId,
} from "@zeitgeistpm/sdk-next";
import CategoricalDisputeBox from "components/outcomes/CategoricalDisputeBox";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import Modal from "components/ui/Modal";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { observer } from "mobx-react";
import { useMemo, useState } from "react";

const DisputeButton = observer(
  ({
    market,
    assetId,
  }: {
    market: Market<IndexerContext>;
    assetId: MarketOutcomeAssetId;
  }) => {
    const [sdk] = useSdkv2();
    const assetIndex = getIndexOf(assetId);

    const { data: disputes } = useMarketDisputes(market);

    const [isOpen, setOpen] = useState(false);

    const disputeDisabled = useMemo(() => {
      const assetAlreadyReported =
        market.marketType.categorical &&
        market.report.outcome.categorical === assetIndex;

      return (sdk && !isRpcSdk(sdk)) || assetAlreadyReported;
    }, [sdk, disputes?.length, market, assetIndex]);

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          disabled={disputeDisabled}
          className="text-mariner font-semibold text-ztg-14-120 disabled:opacity-50"
        >
          Dispute Outcome
        </button>

        <Modal open={isOpen} onClose={() => setOpen(false)}>
          <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white">
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
  },
);

export default DisputeButton;
