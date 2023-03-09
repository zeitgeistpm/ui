import AccountModalContent from "components/account/AccountModalContent";
import AccountModalHead from "components/account/AccountModalHead";
import WalletSelect from "components/account/WalletSelect";
import { useModalStore } from "lib/stores/ModalStore";

export const useAccountModals = () => {
  const modalStore = useModalStore();

  return {
    openAccontSelect: () => {
      modalStore.openModal(<AccountModalContent />, <AccountModalHead />, {
        styles: { width: "500px" },
      });
    },
    openWalletSelect: () => {
      modalStore.openModal(<WalletSelect />, <>"Connect wallet"</>, {
        styles: { width: "500px" },
      });
    },
  };
};
