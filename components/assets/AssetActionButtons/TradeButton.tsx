import { Dialog } from "@headlessui/react";
import { ScalarAssetId, CategoricalAssetId } from "@zeitgeistpm/sdk-next";
import TradeForm from "components/trade-form";
import Modal from "components/ui/Modal";
import { useTradeItem } from "lib/hooks/trade";
import { useState } from "react";

const TradeButton = ({
  assetId,
}: {
  assetId: ScalarAssetId | CategoricalAssetId;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const trade = useTradeItem();

  return (
    <>
      <button
        className="text-mariner font-semibold text-ztg-14-120"
        onClick={() => {
          trade.set({
            assetId: assetId,
            action: "buy",
          });
          setIsOpen(true);
        }}
      >
        Trade
      </button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white">
          <TradeForm />
        </Dialog.Panel>
      </Modal>
    </>
  );
};

export default TradeButton;
