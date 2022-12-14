import { isCodec } from "@polkadot/util";
import {
  CategoricalAssetId,
  fromString,
  getMarketIdOf,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import BuySellButtons from "components/trade-slip/BuySellButtons";
import { useMarket } from "lib/hooks/queries/useMarket";
import { observer } from "mobx-react";
import DisputeButton from "./DisputeButton";
import RedeemButton from "./RedeemButton";
import ReportButton from "./ReportButton";

interface AssetActionButtonsProps {
  assetId?: ScalarAssetId | CategoricalAssetId;
  assetTicker: string;
}

const AssetActionButtons = observer(
  ({ assetId, assetTicker }: AssetActionButtonsProps) => {
    const marketId = getMarketIdOf(assetId);
    const { data: market } = useMarket(marketId);

    if (!market) return null;

    const mdm: any = isCodec(market.disputeMechanism)
      ? market.disputeMechanism.toHuman()
      : market.disputeMechanism;

    if (
      market?.status === "Closed" ||
      (market?.status === "Disputed" && mdm.Authorized)
    ) {
      return <ReportButton assetId={assetId} ticker={assetTicker} />;
    } else if (market?.status === "Reported") {
      return <DisputeButton assetId={assetId} ticker={assetTicker} />;
    } else if (market?.status === "Resolved") {
      return <RedeemButton assetId={assetId} />;
    } else {
      return (
        <BuySellButtons
          assetId={fromString(JSON.stringify(assetId)).unwrap()}
          disabled={assetId == null}
        />
      );
    }
  },
);

export default AssetActionButtons;
