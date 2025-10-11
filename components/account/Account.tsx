import { Dialog } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { useAccountModals } from "lib/state/account";
import AccountModalContent from "./AccountModalContent";
import AccountModalHead from "./AccountModalHead";
import WalletSelect from "./WalletSelect";

export const Account = () => {
  const {
    accountSelectModalOpen,
    walletSelectModalOpen,
    closeAccountSelect,
    closeWalletSelect,
  } = useAccountModals();

  return (
    <>
      <Modal open={accountSelectModalOpen} onClose={closeAccountSelect}>
        <Dialog.Panel className="w-full max-w-[500px] overflow-visible rounded-lg border border-sky-200/30 bg-white/95 p-5 shadow-xl backdrop-blur-md">
          <div className="mb-4">
            <AccountModalHead />
          </div>
          <AccountModalContent />
        </Dialog.Panel>
      </Modal>

      <Modal open={walletSelectModalOpen} onClose={closeWalletSelect}>
        <Dialog.Panel className="w-full max-w-[450px] rounded-lg border border-sky-200/30 bg-white/95 p-6 shadow-xl backdrop-blur-md">
          <WalletSelect />
        </Dialog.Panel>
      </Modal>
    </>
  );
};
