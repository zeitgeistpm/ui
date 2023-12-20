import { atom, useAtom } from "jotai";
import { persistentAtom } from "./util/persistent-atom";

const disclaimerAcceptanceStateAtom = persistentAtom<boolean>({
  key: "disclaimer-acceptance",
  defaultValue: false,
});

const disclaimerDisplayed = atom<boolean>(false);

export const useDisclaimer = (onAccept?: () => void) => {
  console.log(onAccept);

  const [modalOpen, setModalOpen] = useAtom(disclaimerDisplayed);
  const [disclaimerStatus, setDisclaimerStatus] = useAtom(
    disclaimerAcceptanceStateAtom,
  );

  const setDisclaimerAccepted = () => {
    setDisclaimerStatus(true);

    console.log(" onAccept");
    console.log(onAccept);

    onAccept?.();
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
    // onDisclaimerAccepted,
    setDisclaimerAccepted,
  };
};
