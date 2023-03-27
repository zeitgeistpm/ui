import { getWallets } from "@talismn/connect-wallets";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";
import { generateGUID } from "lib/util/generate-guid";
import { proxy, subscribe } from "valtio";
import { useProxy } from "valtio/utils";

export type OnboardingState = {
  session: string;
  walletInstallConfirmed: boolean;
};

const persistensKey = "onboarding";

/**
 * Atom storage of onboarding process.
 *
 * @persistent - local
 */
const proxyState = proxy<OnboardingState>(
  JSON.parse(localStorage.getItem(persistensKey)) || {
    session: generateGUID(),
    walletInstallConfirmed: false,
  },
);

subscribe(proxyState, () => {
  localStorage.setItem(persistensKey, JSON.stringify(proxyState));
});

const session = generateGUID();

export const useOnboarding = () => {
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
