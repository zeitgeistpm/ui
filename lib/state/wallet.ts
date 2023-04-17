import { encodeAddress } from "@polkadot/util-crypto";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { atom, getDefaultStore, useAtom } from "jotai";
import { userLocationDataAtom } from "lib/hooks/useUserLocation";
import { isString } from "lodash-es";
import { useMemo } from "react";
import { PolkadotjsWallet } from "../wallets/polkadotjs-wallet";
import { SubWallet } from "../wallets/subwallet";
import { TalismanWallet } from "../wallets/talisman-wallet";
import { Wallet, WalletAccount } from "../wallets/types";
import { persistentAtom } from "./util/persistent-atom";

export type UseWallet = WalletState &
  WalletUserConfig & {
    /**
     * The selected address of the current wallet.
     */
    selectedAddress?: string;
    /**
     * The active account of the current wallet.
     */
    activeAccount?: WalletAccount;
    /**
     * Select a wallet.
     * @param wallet the selected wallet id or instance
     * @returns void
     */
    selectWallet: (wallet: Wallet | string) => void;
    /**
     * Select an address.
     * @param account the address to select
     * @returns void
     */
    selectAddress: (account: string) => void;
    /**
     * Get the active signer for transactions.
     * @returns KeyringPairOrExtSigner | null
     */
    getActiveSigner: () => KeyringPairOrExtSigner | null;
    /**
     * Disconnect the wallet.
     * @returns void
     */
    disconnectWallet: () => void;
    /**
     * Whether the wallet is nova wallet.
     */
    isNovaWallet: boolean;
  };

/**
 * State type of user wallet config.
 */
export type WalletUserConfig = Partial<{
  walletId: string;
  selectedAddress: string;
}>;

/**
 * State type of wallet.
 */
export type WalletState = {
  /**
   * Whether the wallet is connected.
   */
  connected: boolean;
  /**
   * Instance of the current wallet.
   */
  wallet?: Wallet;
  /**
   * The accounts of the current wallet.
   */
  accounts: WalletAccount[];
  /**
   * Error messages of the wallet.
   */
  errors: WalletError[];
};

/**
 * Transitions the wallet state to a disconnected state.
 *
 * @param wallet WalletState
 * @param userConfig WalletUserConfig
 * @returns [WalletState, WalletUserConfig]
 */
const disconnectWalletStateTransition = (
  wallet: WalletState,
  userConfig: WalletUserConfig,
): [WalletState, WalletUserConfig] => {
  return [
    {
      ...wallet,
      connected: false,
      wallet: undefined,
      accounts: [],
      errors: [],
    },
    {
      ...userConfig,
      walletId: undefined,
    },
  ];
};

/**
 * Atom proxy storage.
 * Used to access and write all atom state in the app.
 */
const store = getDefaultStore();

/**
 * Atom proxy storage of wallet state.
 */
const walletAtom = atom<WalletState>({
  connected: false,
  wallet: undefined,
  accounts: [],
  errors: [],
});

/**
 * Atom proxy storage of user wallet config.
 * Stores the selected wallet and address in localStorage.
 *
 * @warning - when adding migrations all previous migrations in the list will have to left in place.
 */
const userConfigAtom = persistentAtom<WalletUserConfig>({
  store,
  key: "wallet-user-config",
  defaultValue: {},
  migrations: [
    (state: unknown): WalletUserConfig => {
      /**
       * Migrate existing localStorage values to new atom state.
       * So existing users don't have to reselect their wallet and address.
       */
      if (!state || Object.keys(state).length === 0) {
        const walletId = globalThis.localStorage?.getItem("walletId");
        const selectedAddress =
          globalThis.localStorage?.getItem("accountAddress");

        globalThis.localStorage?.removeItem("walletId");
        globalThis.localStorage?.removeItem("accountAddress");

        return {
          walletId,
          selectedAddress,
        };
      }

      return state;
    },
  ],
});

/**
 * Type of wallet errors.
 */
export type WalletError = {
  extensionName: string;
  type: "NoAccounts" | "InteractionDenied";
};

/**
 * List of supported wallets.
 */
export const supportedWallets = [
  new PolkadotjsWallet(),
  new SubWallet(),
  new TalismanWallet(),
];

let accountsSubscriptionUnsub: VoidFunction | null = null;

/**
 * Enable a wallet by enabling the extension and setting the wallet atom state to connected.
 * Also starts subscribing to accounts on the extension and updates the accounts in state.
 *
 * @param walletId the id or wallet itself to enable
 * @returns Promise<boolean> - whether the wallet was enabled
 */
const enableWallet = async (walletId: Wallet | string) => {
  if (accountsSubscriptionUnsub) accountsSubscriptionUnsub();

  const wallet = isString(walletId)
    ? supportedWallets.find((w) => w.extensionName === walletId)
    : walletId;

  try {
    store.set(walletAtom, (state) => {
      return {
        ...state,
        connected: false,
      };
    });

    await wallet.enable();

    store.set(walletAtom, (state) => {
      return {
        ...state,
        wallet,
      };
    });

    accountsSubscriptionUnsub = await wallet.subscribeAccounts((accounts) => {
      store.set(walletAtom, (state) => {
        return {
          ...state,
          connected: accounts.length > 0,
          accounts: accounts.map((account) => {
            return {
              ...account,
              address: encodeAddress(account.address, 73),
            };
          }),
          errors:
            accounts.length === 0
              ? [
                  {
                    extensionName: wallet.extensionName,
                    type: "NoAccounts",
                  },
                ]
              : [],
        };
      });
    });

    return true;
  } catch (error) {
    store.set(walletAtom, (state) => {
      return {
        ...state,
        accounts: [],
        errors: [
          {
            extensionName: wallet.extensionName,
            type: "InteractionDenied",
          },
        ],
      };
    });
    return false;
  }
};

/**
 * Enable wallet on first load if wallet id is set.
 */
if (store.get(userConfigAtom).walletId) {
  enableWallet(store.get(userConfigAtom).walletId);
}

/**
 * Enable wallet when the selected wallet id changes.
 */
store.sub(userConfigAtom, () => {
  const { walletId } = store.get(userConfigAtom);
  if (walletId) {
    enableWallet(walletId);
  }
});

/**
 * Subscribe to user location and vpn changes and
 * disconnect the wallet if location isnt allowed or vpn is used.
 */
store.sub(userLocationDataAtom, async () => {
  const data = await store.get(userLocationDataAtom);
  if (
    store.get(walletAtom).connected &&
    (!data?.locationAllowed || data?.isUsingVPN)
  ) {
    const [newWalletState, newUserConfigState] =
      disconnectWalletStateTransition(
        store.get(walletAtom),
        store.get(userConfigAtom),
      );
    store.set(walletAtom, newWalletState);
    store.set(userConfigAtom, newUserConfigState);
  }
});

/**
 * Hook for interacting with the wallet.
 * @returns UseWallet
 */
export const useWallet = (): UseWallet => {
  const [userConfig, setUserConfig] = useAtom(userConfigAtom);
  const [walletState, setWalletState] = useAtom(walletAtom);

  const selectWallet = (wallet: Wallet | string) => {
    setUserConfig({
      ...userConfig,
      walletId: isString(wallet) ? wallet : wallet.extensionName,
    });
  };

  const disconnectWallet = () => {
    const [newWalletState, newUserConfigState] =
      disconnectWalletStateTransition(walletState, userConfig);
    setWalletState(newWalletState);
    setUserConfig(newUserConfigState);
  };

  const getActiveSigner = (): KeyringPairOrExtSigner | null => {
    if (walletState.wallet == null || !activeAccount) return;
    return {
      address: activeAccount?.address,
      signer: walletState.wallet.signer,
    };
  };

  const selectAddress = (account: WalletAccount | string) => {
    const selectedAddress = isString(account) ? account : account.address;
    try {
      encodeAddress(selectedAddress, 73);
      setUserConfig({
        ...userConfig,
        selectedAddress,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const activeAccount: WalletAccount | undefined = useMemo(() => {
    const userSelectedAddress = walletState.accounts.find((acc) => {
      return (
        userConfig.selectedAddress &&
        encodeAddress(acc.address, 73) ===
          encodeAddress(userConfig.selectedAddress, 73)
      );
    });

    if (!userSelectedAddress) {
      return walletState.accounts[0];
    }

    return userSelectedAddress;
  }, [userConfig.selectedAddress, walletState.accounts]);

  const isNovaWallet: boolean =
    typeof window === "object" && (window as any).walletExtension?.isNovaWallet;

  return {
    ...walletState,
    ...userConfig,
    selectAddress,
    activeAccount,
    selectWallet,
    disconnectWallet,
    getActiveSigner,
    isNovaWallet,
  };
};
