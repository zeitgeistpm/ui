import { atom, useAtom } from "jotai";
import { useDisclaimerModal, useDisclaimerStatus } from "./disclaimer";

const accountsAtom = atom({
  accountSelectModalOpen: false,
  walletSelectModalOpen: false,
});

export const useAccountModals = () => {
  const [state, setState] = useAtom(accountsAtom);
  const { showDisclaimer, setHideDisclaimer, setShowDisclaimer } =
    useDisclaimerModal();
  const { disclaimerAccepted } = useDisclaimerStatus();

  return {
    ...state,
    openAccountSelect: () => {
      setState({ ...state, accountSelectModalOpen: true });
    },
    openWalletSelect: () => {
      console.log(disclaimerAccepted);

      if (disclaimerAccepted) {
        setState({ ...state, walletSelectModalOpen: true });
      } else {
        setShowDisclaimer();
      }
    },
    closeAccountSelect: () => {
      setState({ ...state, accountSelectModalOpen: false });
    },
    closeWalletSelect: () => {
      setState({ ...state, walletSelectModalOpen: false });
    },
  };
};
