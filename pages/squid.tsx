import { NextPage } from "next";
import MarketsList from "components/markets/MarketsList";
import dynamic from "next/dynamic";
import Modal from "components/ui/Modal";
import { Dialog } from "@headlessui/react";

const SquidForm = dynamic(() => import("components/squid-router/SquidForm"), {
  ssr: false,
});

const SquidTest: NextPage = () => {
  return (
    <div>
      <Modal onClose={() => {}} open>
        <Dialog.Panel className="relative min-h-[400px] w-full max-w-[562px] overflow-hidden rounded-lg bg-white">
          <h2 className="w-full bg-slate-800 py-2 text-center text-white">
            Deposit
          </h2>
          <div className="p-3">
            <SquidForm />
          </div>
        </Dialog.Panel>
      </Modal>
    </div>
  );
};

export default SquidTest;
