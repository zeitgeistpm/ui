import {
  CategoricalAssetId,
  fromCompositeIndexerAssetId,
  IndexerContext,
  Market,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import BuySellButtons from "components/trade-slip/BuySellButtons";
import { observer } from "mobx-react";
import DisputeButton from "./DisputeButton";
import RedeemButton from "./RedeemButton";
import ReportButton from "./ReportButton";

interface AssetActionButtonsProps {
  market: Market<IndexerContext>;
  assetId?: ScalarAssetId | CategoricalAssetId;
  assetTicker: string;
}

const AssetActionButtons = observer(
  ({ market, assetId, assetTicker }: AssetActionButtonsProps) => {
    if (!market) {
      console.error("no market");
      return null;
    }
    console.log({ market, assetId });
    if (
      market?.status === "Closed" ||
      (market?.status === "Disputed" && market.disputeMechanism.Authorized)
    ) {
      return (
        <ReportButton market={market} assetId={assetId} ticker={assetTicker} />
      );
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
