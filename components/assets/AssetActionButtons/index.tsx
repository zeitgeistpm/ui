import { CategoricalAssetId, ScalarAssetId } from "@zeitgeistpm/sdk-next";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import DisputeButton from "./DisputeButton";
import RedeemButton from "./RedeemButton";
import ReportButton from "./ReportButton";
import { useState } from "react";
import Modal from "components/ui/Modal";
import TradeForm from "components/trade-form";
import { useTradeItem } from "lib/hooks/trade";
import TradeButton from "./TradeButton";

interface AssetActionButtonsProps {
  marketId: number;
  assetId?: ScalarAssetId | CategoricalAssetId;
}

const AssetActionButtons = observer(
  ({ marketId, assetId }: AssetActionButtonsProps) => {
    const store = useStore();
    const { data: market } = useMarket({ marketId });
    const { data: marketStage } = useMarketStage(market);

    const userAddress = store.wallets?.getActiveSigner()?.address;
    const isOracle = market?.oracle === userAddress;

    if (!market || !marketStage) {
      return null;
    }

    if (
      marketStage.type === "OpenReportingPeriod" ||
      (marketStage.type === "OracleReportingPeriod" && isOracle)
    ) {
      return <ReportButton market={market} assetId={assetId} />;
    }

    if (marketStage.type === "Disputed") {
      return null;
    }

    if (marketStage.type === "Reported") {
      return <DisputeButton market={market} assetId={assetId} />;
    }

    if (marketStage.type === "Resolved") {
      return <RedeemButton assetId={assetId} market={market} />;
    }

    if (marketStage.type === "Trading") {
      return <TradeButton assetId={assetId} />;
    }
  },
);

export default AssetActionButtons;
