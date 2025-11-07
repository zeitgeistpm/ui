import { atom, useAtom } from "jotai";
import { useMemo } from "react";
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

  return useMemo(
    () => ({
      ...state,
      openAccountSelect: () => {
        setState((prev) => ({
          ...prev,
          accountSelectModalOpen: true,
        }));
      },
      openWalletSelect: () => {
        if (disclaimerAccepted) {
          // When opening wallet select, ensure account select is closed
          setState((prev) => ({
            ...prev,
            accountSelectModalOpen: false,
            walletSelectModalOpen: true,
          }));
        } else {
          showDisclaimer();
        }
      },
      closeAccountSelect: () => {
        setState((prev) => ({ ...prev, accountSelectModalOpen: false }));
      },
      closeWalletSelect: () => {
        setState((prev) => ({ ...prev, walletSelectModalOpen: false }));
      },
      closeAllModals: () => {
        setState((prev) => ({
          ...prev,
          accountSelectModalOpen: false,
          walletSelectModalOpen: false,
        }));
      },
    }),
    [state, disclaimerAccepted, showDisclaimer],
  );
};
