import { Dialog, Tab } from "@headlessui/react";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketIsTradingEnabled } from "lib/hooks/queries/useMarketIsTradingEnabled";
import dynamic from "next/dynamic";
import { useState } from "react";

import BuyFullSetForm from "./BuyFullSetForm";
import SellFullSetForm from "./SellFullSetForm";

const BuySellFullSetsButton = ({
  buttonClassName,
  marketId,
}: {
  marketId: number;
  buttonClassName?: string;
}) => {
  const { data: market } = useMarket({ marketId });
  const enabled = useMarketIsTradingEnabled(market);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SecondaryButton
        disabled={!enabled}
        onClick={() => setIsOpen(true)}
        className="max-w-[160px]"
      >
        Buy/Sell Full Set
      </SecondaryButton>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white">
          <Tab.Group>
            <Tab.List className="flex h-[71px] text-center font-medium text-ztg-18-150">
              <Tab className="ui-selected:font-bold ui-selected:bg-white bg-anti-flash-white transition-all w-1/2 rounded-tl-[10px]">
                Buy
              </Tab>
              <Tab className="ui-selected:font-bold ui-selected:bg-white bg-anti-flash-white transition-all w-1/2 rounded-tr-[10px]">
                Sell
              </Tab>
            </Tab.List>

            <Tab.Panels className="p-[30px]">
              <Tab.Panel>
                <BuyFullSetForm
                  marketId={marketId}
                  onSuccess={() => setIsOpen(false)}
                />
              </Tab.Panel>
              <Tab.Panel>
                <SellFullSetForm
                  marketId={marketId}
                  onSuccess={() => setIsOpen(false)}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </Dialog.Panel>
      </Modal>
    </>
  );
};

export default dynamic(() => Promise.resolve(BuySellFullSetsButton), {
  ssr: false,
});
