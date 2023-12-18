import { atom, useAtom } from "jotai";
import { persistentAtom } from "./util/persistent-atom";

const disclaimerAcceptanceStateAtom = persistentAtom<boolean>({
  key: "disclaimer-acceptance",
  defaultValue: false,
});

const showDisclaimer = atom<boolean>(false);

export const useDisclaimerStatus = () => {
  const [state, setState] = useAtom(disclaimerAcceptanceStateAtom);

  const onDisclaimerAccepted = () => {
    setState(true);
  };

  const setDisclaimerAccepted = () => {
    setState(true);
  };

  return {
    disclaimerAccepted: state,
    onDisclaimerAccepted,
    setDisclaimerAccepted,
  };
};

export const useDisclaimerModal = (onAccept?: () => void) => {
  const [state, setState] = useAtom(showDisclaimer);

  //add a call back for what to do after acceptance
  const setShowDisclaimer = () => {
    setState(true);
  };
  const setHideDisclaimer = () => {
    setState(false);
  };

  return { showDisclaimer: state, setHideDisclaimer, setShowDisclaimer };
};
