import { atom, useAtom } from "jotai";
import { useDisclaimer } from "./disclaimer";

const accountsAtom = atom({
  accountSelectModalOpen: false,
  walletSelectModalOpen: false,
});

export const useAccountModals = () => {
  const [state, setState] = useAtom(accountsAtom);

  const { showDisclaimer, disclaimerAccepted } = useDisclaimer(() => {
    setState({ ...state, walletSelectModalOpen: true });
  });

  return {
    ...state,
    openAccountSelect: () => {
      setState({
        ...state,
        accountSelectModalOpen: true,
      });
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
