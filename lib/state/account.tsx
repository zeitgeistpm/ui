import { atom, useAtom } from "jotai";

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
    },
    openWalletSelect: () => {
      setState({ ...state, walletSelectModalOpen: true });
    },
    closeAccountSelect: () => {
      setState({ ...state, accountSelectModalOpen: false });
    },
    closeWalletSelect: () => {
      setState({ ...state, walletSelectModalOpen: false });
    },
  };
};
