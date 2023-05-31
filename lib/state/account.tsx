import { atom, useAtom } from "jotai";

const accountsAtom = atom({
  accountSelectModalOpen: false,
  walletSelectModalOpen: false,
  accountSelectedCallbacks: [] as ((address: string) => void)[],
});

export const useAccountModals = () => {
  const [state, setState] = useAtom(accountsAtom);

  return {
    ...state,
    openAccountSelect: (onSelect?: (address: string) => void) => {
      setState({
        ...state,
        accountSelectModalOpen: true,
        accountSelectedCallbacks: onSelect
          ? [...state.accountSelectedCallbacks, onSelect]
          : state.accountSelectedCallbacks,
      });
    },
    openWalletSelect: () => {
      setState({ ...state, walletSelectModalOpen: true });
    },
    closeAccountSelect: () => {
      setState({
        ...state,
        accountSelectModalOpen: false,
        accountSelectedCallbacks: [],
      });
    },
    closeWalletSelect: () => {
      setState({ ...state, walletSelectModalOpen: false });
    },
  };
};
