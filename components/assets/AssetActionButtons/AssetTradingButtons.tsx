import { Dialog } from "@headlessui/react";
import {
  CategoricalAssetId,
  ScalarAssetId,
  getMarketIdOf,
} from "@zeitgeistpm/sdk";
import TradeForm from "components/trade-form";
import Amm2TradeForm from "components/trade-form/Amm2TradeForm";
import { TradeTabType } from "components/trade-form/TradeTab";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useTradeItem } from "lib/hooks/trade";
import { useState } from "react";
import { ScoringRule } from "@zeitgeistpm/indexer";

const AssetTradingButtons = ({
  assetId,
}: {
  assetId: ScalarAssetId | CategoricalAssetId;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { data: tradeItem, set: setTradeItem } = useTradeItem();
  const marketId = getMarketIdOf(assetId);
  const { data: market } = useMarket({ marketId });

  return (
    <>
      <div className="flex justify-end gap-x-2">
        <SecondaryButton
          onClick={() => {
            setTradeItem({
              assetId: assetId,
              action: "buy",
            });
            setIsOpen(true);
          }}
        >
          Buy
        </SecondaryButton>
        <SecondaryButton
          onClick={() => {
            setTradeItem({
              assetId: assetId,
              action: "sell",
            });
            setIsOpen(true);
          }}
        >
          Sell
        </SecondaryButton>
      </div>
      {tradeItem && (
        <Modal open={isOpen} onClose={() => setIsOpen(false)}>
          <Dialog.Panel className="w-full max-w-[564px] rounded-[10px] bg-white">
            {market?.scoringRule === ScoringRule.Lmsr ? (
              <Amm2TradeForm
                marketId={marketId}
                initialAsset={assetId}
                selectedTab={
                  tradeItem.action === "buy"
                    ? TradeTabType.Buy
                    : TradeTabType.Sell
                }
              />
            ) : (
              <TradeForm />
            )}
          </Dialog.Panel>
        </Modal>
      )}
    </>
  );
};

export default AssetTradingButtons;
