import AccountModalContent from "components/account/AccountModalContent";
import AccountModalHead from "components/account/AccountModalHead";
import WalletSelect from "components/account/WalletSelect";
import { atom, useAtom } from "jotai";
import { useModalStore } from "lib/stores/ModalStore";

const accountsAtom = atom({
  accountSelectModalOpen: false,
  walletSelectModalOpen: false,
});

export const useAccountModals = () => {
  const [state, setState] = useAtom(accountsAtom);

  return {
    ...state,
    openAccountSelect: () => {
      setState({ ...state, accountSelectModalOpen: true });
      // modalStore.openModal(<AccountModalContent />, <AccountModalHead />, {
      //   styles: { width: "500px" },
      // });
    },
    openWalletSelect: () => {
      setState({ ...state, walletSelectModalOpen: true });
      // modalStore.openModal(<WalletSelect />, <>Connect wallet</>, {
      //   styles: { width: "500px" },
      // });
    },
    closeAccountSelect: () => {
      setState({ ...state, accountSelectModalOpen: false });
    },
    closeWalletSelect: () => {
      setState({ ...state, walletSelectModalOpen: false });
    },
  };
};
