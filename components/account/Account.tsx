import Modal, { ModalProps } from "components/ui/Modal";
import { ModalPanel, ModalHeader, ModalBody } from "components/ui/ModalPanel";
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
    closeAllModals,
  } = useAccountModals();

  const handleWalletSelectClose = () => {
    closeAllModals();
  };

  return (
    <>
      {!walletSelectModalOpen && (
        <Modal
          key="account-select-modal"
          open={accountSelectModalOpen}
          onClose={closeAccountSelect}
          enableScrollLock={true}
        >
          <ModalPanel size="lg" className="flex flex-col">
            <div className="pt-4 px-6">
              <AccountModalHead />
            </div>
            <ModalBody>
              <AccountModalContent />
            </ModalBody>
          </ModalPanel>
        </Modal>
      )}

      <Modal
        key="wallet-select-modal"
        open={walletSelectModalOpen}
        onClose={handleWalletSelectClose}
        enableScrollLock={true}
      >
        <ModalPanel size="md" className="flex flex-col">
          <ModalBody>
            <WalletSelect />
          </ModalBody>
        </ModalPanel>
      </Modal>
    </>
  );
};
