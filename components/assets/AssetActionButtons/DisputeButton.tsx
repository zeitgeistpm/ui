import {
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  MarketOutcomeAssetId,
} from "@zeitgeistpm/sdk-next";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotifications } from "lib/state/notifications";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useMemo } from "react";
import CategoricalDisputeBox from "components/outcomes/CategoricalDisputeBox";

const DisputeButton = observer(
  ({
    market,
    assetId,
  }: {
    market: Market<IndexerContext>;
    assetId: MarketOutcomeAssetId;
  }) => {
    const [sdk, id] = useSdkv2();
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotifications();
    const modalStore = useModalStore();

    const ticker = market.categories?.[getIndexOf(assetId)].ticker;

    const { data: disputes } = useMarketDisputes(market);

    const disputeDisabled = useMemo(() => {
      return sdk && !isRpcSdk(sdk);
    }, [sdk, disputes?.length]);

    const handleClick = async () => {
      if (market.marketType.scalar) {
        modalStore.openModal(
          <div>
            <ScalarDisputeBox market={market} />
          </div>,
          <>Dispute outcome</>,
        );
      } else if (isRpcSdk(sdk)) {
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
        className="text-mariner font-semibold text-ztg-14-120"
      >
        Dispute Outcome
      </button>
    );
  },
);

export default DisputeButton;
