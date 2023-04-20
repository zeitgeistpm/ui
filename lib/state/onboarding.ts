import { getWallets } from "@talismn/connect-wallets";
import { useAtom } from "jotai";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";
import { generateGUID } from "lib/util/generate-guid";
import { persistentAtom } from "./util/persistent-atom";

export type OnboardingState = {
  /**
   * Session ID of the onboarding process.
   * Needed when the user refreshes the page so we can decide if we want to show the modal again.
   */
  session: string;
  /**
   * Whether the user has confirmed the wallet installation.
   */
  walletInstallConfirmed: boolean;
};

export type UseOnboarding = {
  /**
   * Whether the user has a wallet installed.
   */
  hasWallet: boolean;
  /**
   * Set the wallet install confirmation.
   *
   * @param value confirmation
   * @returns void
   */
  setWalletInstallConfirmed: (value: boolean) => void;
  /**
   * Whether the user has just confirmed the wallet installation.
   */
  walletInstallJustConfirmed: boolean;
};

/**
 * Atom storage of onboarding process.
 * @persistent - local
 */
const onboardingAtom = persistentAtom<OnboardingState>({
  key: "onboarding-state",
  defaultValue: {
    session: generateGUID(),
    walletInstallConfirmed: false,
  },
});

/**
 * Session ID of the current onboarding process.
 */
const session = generateGUID();

/**
 * Hook for interacting with the onboarding process.
 *
 * @returns UseOnboarding
 */
export const useOnboarding = (): UseOnboarding => {
  const [state, setState] = useAtom(onboardingAtom);

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

  const setWalletInstallConfirmed = (walletInstallConfirmed: boolean) => {
    setState({ ...state, walletInstallConfirmed, session });
  };

  return {
    hasWallet,
    setWalletInstallConfirmed,
    walletInstallJustConfirmed,
  };
};
