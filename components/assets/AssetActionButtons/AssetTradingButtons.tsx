import { Dialog } from "@headlessui/react";
import {
  AssetId,
  CategoricalAssetId,
  IOCategoricalAssetId,
  IOMarketOutcomeAssetId,
  IOScalarAssetId,
  ScalarAssetId,
  getMarketIdOf,
} from "@zeitgeistpm/sdk";
import Amm2TradeForm from "components/trade-form/Amm2TradeForm";
import { TradeTabType } from "components/trade-form/TradeTab";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import { useTradeItem } from "lib/hooks/trade";
import { useState } from "react";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { CombinatorialToken } from "lib/types/combinatorial";

const AssetTradingButtons = ({
  assetId,
  marketIdOverride,
}: {
  assetId: AssetId;
  marketIdOverride?: number;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { data: tradeItem, set: setTradeItem } = useTradeItem();

  // For combinatorial tokens, we need to use the marketIdOverride
  // For regular market outcomes, use getMarketIdOf
  const marketId =
    marketIdOverride ??
    (IOMarketOutcomeAssetId.is(assetId) ? getMarketIdOf(assetId) : 0);

  // Convert AssetId to the appropriate type for TradeItem
  const getTradeAssetId = ():
    | CategoricalAssetId
    | ScalarAssetId
    | CombinatorialToken
    | undefined => {
    if (IOCategoricalAssetId.is(assetId)) {
      return assetId;
    } else if (IOScalarAssetId.is(assetId)) {
      return assetId;
    } else if (isCombinatorialToken(assetId)) {
      return assetId;
    }
    return undefined;
  };

  const tradeAssetId = getTradeAssetId();

  if (!tradeAssetId) {
    return null; // Can't trade pool shares or other asset types
  }

  return (
    <>
      <div className="flex justify-end gap-x-2">
        <SecondaryButton
          onClick={() => {
            setTradeItem({
              assetId: tradeAssetId,
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
              assetId: tradeAssetId,
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
            <Amm2TradeForm
              marketId={marketId}
              initialAsset={tradeAssetId}
              selectedTab={
                tradeItem.action === "buy"
                  ? TradeTabType.Buy
                  : TradeTabType.Sell
              }
            />
          </Dialog.Panel>
        </Modal>
      )}
    </>
  );
};

export default AssetTradingButtons;
