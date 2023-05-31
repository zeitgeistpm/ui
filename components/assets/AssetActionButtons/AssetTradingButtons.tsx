import { Dialog } from "@headlessui/react";
import { ScalarAssetId, CategoricalAssetId } from "@zeitgeistpm/sdk-next";
import TradeForm from "components/trade-form";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import { useTradeItem } from "lib/hooks/trade";
import { useState } from "react";

const AssetTradingButtons = ({
  assetId,
}: {
  assetId: ScalarAssetId | CategoricalAssetId;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { data: tradeItem, set: setTradeItem } = useTradeItem();

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
          <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white">
            <TradeForm />
          </Dialog.Panel>
        </Modal>
      )}
    </>
  );
};

export default AssetTradingButtons;
