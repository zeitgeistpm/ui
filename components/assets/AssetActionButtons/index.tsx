import { CategoricalAssetId, ScalarAssetId } from "@zeitgeistpm/sdk-next";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useWallet } from "lib/state/wallet";

import DisputeButton from "./DisputeButton";
import RedeemButton from "./RedeemButton";
import ReportButton from "./ReportButton";
import AssetTradingButtons from "./AssetTradingButtons";

interface AssetActionButtonsProps {
  marketId: number;
  assetId?: ScalarAssetId | CategoricalAssetId;
}

const AssetActionButtons = ({ marketId, assetId }: AssetActionButtonsProps) => {
  const { data: market } = useMarket({ marketId });
  const { data: marketStage } = useMarketStage(market ?? undefined);

  const wallet = useWallet();
  const isOracle = market?.oracle === wallet.realAddress;

  if (!market || !marketStage) {
    return <></>;
  }

  if (
    marketStage.type === "OpenReportingPeriod" ||
    (marketStage.type === "OracleReportingPeriod" && isOracle)
  ) {
    return <ReportButton market={market} assetId={assetId} />;
  }

  if (marketStage.type === "Disputed") {
    return <></>;
  }

  if (marketStage.type === "Reported") {
    return <DisputeButton market={market} assetId={assetId} />;
  }

  if (marketStage.type === "Resolved") {
    return <>{assetId && <RedeemButton assetId={assetId} market={market} />}</>;
  }

  if (marketStage.type === "Trading") {
    return <>{assetId && <AssetTradingButtons assetId={assetId} />}</>;
  }

  return <></>;
};

export default AssetActionButtons;
