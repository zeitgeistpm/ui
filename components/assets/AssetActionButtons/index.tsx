import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import BuySellButtons from "components/trade-slip/BuySellButtons";
import { useMarketsStore } from "lib/stores/MarketsStore";
import MarketStore from "lib/stores/MarketStore";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import DisputeButton from "./DisputeButton";
import RedeemButton from "./RedeemButton";
import ReportButton from "./ReportButton";

interface AssetActionButtonsProps {
  marketId: number;
  assetId?: AssetId;
  assetTicker: string;
  assetColor?: string;
}

const AssetActionButtons = observer(
  ({ marketId, assetId, assetColor, assetTicker }: AssetActionButtonsProps) => {
    const marketsStore = useMarketsStore();
    const [marketStore, setMarketStore] = useState<MarketStore>();

    useEffect(() => {
      if (assetId == null) {
        return;
      }
      (async () => {
        const market = await marketsStore.getMarket(marketId);
        setMarketStore(market);
      })();
    }, [marketId, marketsStore]);

    if (
      marketStore?.status === "Closed" ||
      (marketStore?.status === "Disputed" &&
        marketStore?.disputeMechanism === "authorized")
    ) {
      return (
        <ReportButton
          marketStore={marketStore}
          assetId={assetId}
          ticker={assetTicker}
        />
      );
    } else if (marketStore?.status === "Reported") {
      return (
        <DisputeButton
          marketStore={marketStore}
          assetId={assetId}
          ticker={assetTicker}
        />
      );
    } else if (marketStore?.status === "Resolved") {
      return <RedeemButton marketStore={marketStore} assetId={assetId} />;
    } else {
      return (
        <BuySellButtons
          item={{
            amount: "",
            assetId: assetId,
            marketId: marketId,
            assetTicker: assetTicker,
            assetColor: assetColor,
          }}
          disabled={assetId == null}
        />
      );
    }
  },
);

export default AssetActionButtons;
