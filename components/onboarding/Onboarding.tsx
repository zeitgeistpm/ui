import { useMemo, useState } from "react";
import { useOnboarding } from "lib/state/onboarding";
import { DesktopOnboardingModal } from "components/account/OnboardingModal";
import Modal from "components/ui/Modal";

export const Onboarding = () => {
  const onboarding = useOnboarding();

  const step = onboarding.hasWallet ? 3 : 2;

  const walletInstallJustConfirmed = useMemo(
    () => onboarding.walletInstallJustConfirmed,
    [],
  );

  const [closed, setClosed] = useState(false);

  return (
    <Modal
      open={!closed && walletInstallJustConfirmed}
      onClose={() => {
        setClosed(true);
        onboarding.setWalletInstallConfirmed(false);
      }}
    >
      <DesktopOnboardingModal
        step={step}
        notice={
          step === 2
            ? "Remember to install one of the supported wallets before continuing."
            : null
        }
      />
    </Modal>
  );
};

export default Onboarding;
