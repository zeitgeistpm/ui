import { getWallets } from "@talismn/connect-wallets";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";
import { generateGUID } from "lib/util/generate-guid";
import { proxy, subscribe } from "valtio";
import { useProxy } from "valtio/utils";
import { persistentProxy } from "./util/persistent-proxy";

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

const persistensKey = "onboarding";

/**
 * Atom proxy storage of onboarding process.
 * @persistent - local
 */
const proxyState = persistentProxy<OnboardingState>("onboarding", {
  session: generateGUID(),
  walletInstallConfirmed: false,
});

/**
 * Session ID of the current onboarding process.
 */
const session = generateGUID();

/**
 *
 * @returns
 */
export const useOnboarding = (): UseOnboarding => {
  const state = useProxy(proxyState);

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

  const setWalletInstallConfirmed = (value: boolean) => {
    state.walletInstallConfirmed = value;
    state.session = session;
  };

  return {
    hasWallet,
    setWalletInstallConfirmed,
    walletInstallJustConfirmed,
  };
};
