import { Dialog, Tab } from "@headlessui/react";
import { MarketStatus } from "@zeitgeistpm/indexer";
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
  const enabled = useMarketIsTradingEnabled(market ?? undefined);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SecondaryButton
        disabled={market?.status !== MarketStatus.Active}
        onClick={() => setIsOpen(true)}
        className="max-w-[160px]"
      >
        Buy/Sell Full Set
      </SecondaryButton>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[564px] rounded-lg border border-sky-200/30 bg-white/95 shadow-xl backdrop-blur-lg">
          <Tab.Group>
            <Tab.List className="flex h-16 text-center text-base font-semibold">
              <Tab className="w-1/2 rounded-tl-lg border-b border-sky-200/30 bg-sky-50/50 transition-all ui-selected:border-b-0 ui-selected:bg-white/95 ui-selected:font-bold ui-selected:text-sky-900">
                Buy Full Set
              </Tab>
              <Tab className="w-1/2 rounded-tr-lg border-b border-sky-200/30 bg-sky-50/50 transition-all ui-selected:border-b-0 ui-selected:bg-white/95 ui-selected:font-bold ui-selected:text-sky-900">
                Sell Full Set
              </Tab>
            </Tab.List>

            <Tab.Panels className="p-5">
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
