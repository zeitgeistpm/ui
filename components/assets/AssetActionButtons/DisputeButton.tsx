import {
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  MarketOutcomeAssetId,
} from "@zeitgeistpm/sdk-next";
import CategoricalDisputeBox from "components/outcomes/CategoricalDisputeBox";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useModalStore } from "lib/stores/ModalStore";
import { observer } from "mobx-react";
import { useMemo } from "react";

const DisputeButton = observer(
  ({
    market,
    assetId,
  }: {
    market: Market<IndexerContext>;
    assetId: MarketOutcomeAssetId;
  }) => {
    const [sdk] = useSdkv2();
    const modalStore = useModalStore();
    const assetIndex = getIndexOf(assetId);

    const { data: disputes } = useMarketDisputes(market);

    const disputeDisabled = useMemo(() => {
      const assetAlreadyReported =
        market.marketType.categorical &&
        market.report.outcome.categorical === assetIndex;

      return (sdk && !isRpcSdk(sdk)) || assetAlreadyReported;
    }, [sdk, disputes?.length, market, assetIndex]);

    const handleClick = async () => {
      if (market.marketType.scalar) {
        modalStore.openModal(
          <div>
            <ScalarDisputeBox market={market} />
          </div>,
          <>Dispute outcome</>,
        );
      } else {
        modalStore.openModal(
          <div>
            <CategoricalDisputeBox market={market} assetId={assetId} />
          </div>,
          <>Dispute outcome</>,
        );
      }
    };
    return (
      <button
        onClick={handleClick}
        disabled={disputeDisabled}
        className="text-mariner font-semibold text-ztg-14-120 disabled:opacity-50"
      >
        Dispute Outcome
      </button>
    );
  },
);

export default DisputeButton;
