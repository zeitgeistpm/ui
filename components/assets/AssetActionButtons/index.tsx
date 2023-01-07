import {
  CategoricalAssetId,
  fromCompositeIndexerAssetId,
  IndexerContext,
  Market,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import BuySellButtons from "components/trade-slip/BuySellButtons";
import { useMarket } from "lib/hooks/queries/useMarket";
import { observer } from "mobx-react";
import DisputeButton from "./DisputeButton";
import RedeemButton from "./RedeemButton";
import ReportButton from "./ReportButton";

interface AssetActionButtonsProps {
  marketId: number;
  assetId?: ScalarAssetId | CategoricalAssetId;
  assetTicker: string;
}

const AssetActionButtons = observer(
  ({ marketId, assetId, assetTicker }: AssetActionButtonsProps) => {
    const { data: market } = useMarket(marketId);

    if (!market) {
      return null;
    }

    if (
      market?.status === "Closed" ||
      (market?.status === "Disputed" && market.disputeMechanism.Authorized)
    ) {
      return (
        <ReportButton market={market} assetId={assetId} ticker={assetTicker} />
      );
    } else if (market?.status === "Disputed") {
      return null;
    } else if (market?.status === "Reported") {
      return (
        <DisputeButton market={market} assetId={assetId} ticker={assetTicker} />
      );
    } else if (market?.status === "Resolved") {
      return <RedeemButton assetId={assetId} market={market} />;
    } else {
      return <BuySellButtons assetId={assetId} disabled={assetId == null} />;
    }
  },
);

export default AssetActionButtons;
