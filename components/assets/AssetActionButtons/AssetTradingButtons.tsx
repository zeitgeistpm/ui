import { Dialog } from "@headlessui/react";
import { ScalarAssetId, CategoricalAssetId } from "@zeitgeistpm/sdk-next";
import TradeForm from "components/trade-form";
import { TradeTabType } from "components/trade-form/TradeTab";
import Modal from "components/ui/Modal";
import { useTradeItem } from "lib/hooks/trade";
import { TradeType } from "lib/types";
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
      <div className="flex justify-end">
        <button
          className="border-gray-300 text-sm border-2 rounded-full py-2 px-5 mr-2"
          onClick={() => {
            setTradeItem({
              assetId: assetId,
              action: "buy",
            });
            setIsOpen(true);
          }}
        >
          Buy
        </button>
        <button
          className="border-gray-300 text-sm border-2 rounded-full py-2 px-5"
          onClick={() => {
            setTradeItem({
              assetId: assetId,
              action: "sell",
            });
            setIsOpen(true);
          }}
        >
          Sell
        </button>
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
