import { Dialog } from "@headlessui/react";
import {
  CategoricalAssetId,
  ScalarAssetId,
  getMarketIdOf,
} from "@zeitgeistpm/sdk";
import Amm2TradeForm from "components/trade-form/Amm2TradeForm";
import { TradeTabType } from "components/trade-form/TradeTab";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useState } from "react";
import { ScoringRule } from "@zeitgeistpm/indexer";

const AssetTradingButtons = ({
  assetId,
}: {
  assetId: ScalarAssetId | CategoricalAssetId;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const marketId = getMarketIdOf(assetId);
  const { data: market } = useMarket({ marketId });
  const [tradeType, setTradeType] = useState(TradeTabType.Buy);

  return (
    <>
      <div className="flex justify-end gap-x-2">
        <SecondaryButton
          onClick={() => {
            setTradeType(TradeTabType.Buy);
            setIsOpen(true);
          }}
        >
          Buy
        </SecondaryButton>
        <SecondaryButton
          onClick={() => {
            setTradeType(TradeTabType.Sell);
            setIsOpen(true);
          }}
        >
          Sell
        </SecondaryButton>
      </div>
      {
        <Modal open={isOpen} onClose={() => setIsOpen(false)}>
          <Dialog.Panel className="w-full max-w-[564px] rounded-[10px] bg-white">
            <Amm2TradeForm
              marketId={marketId}
              initialAsset={assetId}
              selectedTab={tradeType}
            />
          </Dialog.Panel>
        </Modal>
      }
    </>
  );
};

export default AssetTradingButtons;
