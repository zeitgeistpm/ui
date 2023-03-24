import { getWallets } from "@talismn/connect-wallets";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";

export type OnboardingState = {
  session: number;
  walletInstallConfirmed: boolean;
};

const generateSession = () => Math.floor(Math.random() * 1000000000);

/**
 * Atom storage of onboarding process.
 *
 * @persistent - local
 */
const onboardingAtom = atomWithStorage<OnboardingState>("onboarding", {
  session: generateSession(),
  walletInstallConfirmed: false,
});

const session = generateSession();

export const useOnboarding = () => {
  const [state, update] = useAtom(onboardingAtom);

  const hasWallet =
    typeof window !== "undefined" &&
    getWallets().some(
      (wallet) =>
        wallet?.installed &&
        SUPPORTED_WALLET_NAMES.some(
          (walletName) => walletName === wallet.extensionName,
        ),
    );

  const walletInstallJustConfirmed =
    state.walletInstallConfirmed && state.session !== session;

  const setWalletInstallConfirmed = (value: boolean) =>
    update({ walletInstallConfirmed: value, session });

  return {
    hasWallet,
    setWalletInstallConfirmed,
    walletInstallJustConfirmed,
  };
};
