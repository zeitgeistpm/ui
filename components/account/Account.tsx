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
        <Dialog.Panel className="bg-white rounded-ztg-10 p-[15px]">
          <div className="mb-3">
            <AccountModalHead />
          </div>
          <AccountModalContent />
        </Dialog.Panel>
      </Modal>

      <Modal open={walletSelectModalOpen} onClose={closeWalletSelect}>
        <Dialog.Panel
          className="
    w-full max-w-[564px]  rounded-ztg-10 bg-white p-[15px]"
        >
          <WalletSelect />
        </Dialog.Panel>
      </Modal>
    </>
  );
};
