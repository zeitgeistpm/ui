import { Dialog } from "@headlessui/react";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import { useState } from "react";
import { ArrowRight } from "react-feather";

const DepositButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Deposit</button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <DepositModal />
      </Modal>
    </>
  );
};

const DepositModal = () => {
  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3>Deposit</h3>
      <div className="flex flex-col w-full items-center gap-8 mt-[20px] text-ztg-18-150 font-semibold">
        <div className="flex gap-4">
          <div>Polkadot</div>
          <ArrowRight />
          <div>Zeitgeist</div>
        </div>
        <div className="h-[56px] bg-anti-flash-white center text-ztg-18-150 relative font-normal">
          <input
            type="number"
            className="w-full bg-transparent outline-none !text-center"
          />
          <div className="mr-[10px] absolute right-0">ZTG</div>
        </div>
        <TransactionButton className="w-full max-w-[250px]">
          Confirm Deposit
        </TransactionButton>
      </div>
    </Dialog.Panel>
  );
};

export default DepositButton;
