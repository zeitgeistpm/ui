import { atom, useAtom } from "jotai";
import { persistentAtom } from "./util/persistent-atom";
import { useEffect, useMemo } from "react";

const disclaimerAcceptanceStateAtom = persistentAtom<boolean>({
  key: "disclaimer-acceptance",
  defaultValue: false,
});

const disclaimerDisplayed = atom<boolean>(false);

export const useDisclaimer = (onAccept?: () => void) => {
  const [modalOpen, setModalOpen] = useAtom(disclaimerDisplayed);
  const [disclaimerStatus, setDisclaimerStatus] = useAtom(
    disclaimerAcceptanceStateAtom,
  );

  const initialDisclaimerStatus = useMemo(() => {
    return disclaimerStatus;
  }, []);

  useEffect(() => {
    if (!initialDisclaimerStatus && disclaimerStatus) {
      onAccept?.();
    }
  }, [disclaimerStatus]);

  const setDisclaimerAccepted = () => {
    setDisclaimerStatus(true);
  };

  const showDisclaimer = () => {
    setModalOpen(true);
  };
  const hideDisclaimer = () => {
    setModalOpen(false);
  };

  return {
    modalOpen,
    hideDisclaimer,
    showDisclaimer,
    disclaimerAccepted: disclaimerStatus,
    setDisclaimerAccepted,
  };
};
