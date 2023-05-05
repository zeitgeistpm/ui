import { Dialog } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketIsTradingEnabled } from "lib/hooks/queries/useMarketIsTradingEnabled";
import dynamic from "next/dynamic";
import { useState } from "react";

import BuyFullSetForm from "./BuyFullSetForm";
import SellFullSetForm from "./SellFullSetForm";

const FullSetButtons = ({ marketId }: { marketId: number }) => {
  const { data: market } = useMarket({ marketId });
  const enabled = useMarketIsTradingEnabled(market);

  const [buyModalIsOpen, setBuyModalIsOpen] = useState(false);
  const [sellModalIsOpen, setSellModalIsOpen] = useState(false);

  return (
    <div>
      {enabled ? (
        <>
          <button
            onClick={() => setBuyModalIsOpen(true)}
            className="h-ztg-19 text-sky-600 border-sky-600 rounded-ztg-100 border-2 text-ztg-10-150 px-ztg-10 font-bold"
          >
            Buy Full Set
          </button>
          <button
            onClick={() => setSellModalIsOpen(true)}
            className="h-ztg-19 ml-ztg-15 text-sky-600 border-sky-600 rounded-ztg-100 border-2 text-ztg-10-150 px-ztg-10 font-bold"
          >
            Sell Full Set
          </button>
        </>
      ) : (
        <></>
      )}

      <Modal open={buyModalIsOpen} onClose={() => setBuyModalIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white">
          <BuyFullSetForm
            marketId={marketId}
            onSuccess={() => setBuyModalIsOpen(false)}
          />
        </Dialog.Panel>
      </Modal>

      <Modal open={sellModalIsOpen} onClose={() => setSellModalIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white">
          <SellFullSetForm
            marketId={marketId}
            onSuccess={() => setSellModalIsOpen(false)}
          />
        </Dialog.Panel>
      </Modal>
    </div>
  );
};

export default dynamic(() => Promise.resolve(FullSetButtons), {
  ssr: false,
});
