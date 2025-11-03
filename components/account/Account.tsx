import Modal, { ModalProps } from "components/ui/Modal";
import { ModalPanel } from "components/ui/ModalPanel";
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
        <ModalPanel maxWidth="md" className="overflow-visible p-5">
          <div className="mb-4">
            <AccountModalHead />
          </div>
          <AccountModalContent />
        </ModalPanel>
      </Modal>

      <Modal open={walletSelectModalOpen} onClose={closeWalletSelect}>
        <ModalPanel maxWidth="lg" className="p-6">
          <WalletSelect />
        </ModalPanel>
      </Modal>
    </>
  );
};
