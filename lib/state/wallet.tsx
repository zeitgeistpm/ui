import { InjectedAccount } from "@polkadot/extension-inject/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { stringToHex, u8aToHex } from "@polkadot/util";
import {
  cryptoWaitReady,
  encodeAddress,
  decodeAddress,
} from "@polkadot/util-crypto";
import {
  BaseDotsamaWallet,
  PolkadotjsWallet,
  SubWallet,
  TalismanWallet,
} from "@talismn/connect-wallets";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/rpc";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";
import { atom, getDefaultStore, useAtom } from "jotai";
import { isPresent } from "lib/types";
import { PollingTimeout, poll } from "lib/util/poll";
import { isString } from "lodash-es";
import { useMemo } from "react";
import { persistentAtom } from "./util/persistent-atom";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import {
  Notification,
  pushNotification,
  removeNotification,
} from "./notifications";
import { web3AuthWalletInstance } from "./util/web3auth-config";

const DAPP_NAME = "zeitgeist";

export type UseWallet = WalletState & {
  /**
   * The real address of the current wallet.
   * Use this to read data from the blockchain or the indexer when it comes to assets and markets.
   * It will be the address the activeAccount is proxying for if proxy execution is enabled.
   */
  realAddress?: string;
  /**
   * The active account of the current wallet.
   */
  activeAccount?: InjectedAccount;
  /**
   * Whether the wallet is nova wallet.
   */
  isNovaWallet: boolean;
  /**
   * Name of the wallet being used
   */
  walletId?: string;
  /**
   * Get the active signer for transactions. Is either the real account or the proxy account.
   */
  getSigner: () => KeyringPairOrExtSigner | undefined;
  /**
   * Select a wallet.
   * @param wallet the selected wallet id or instance
   * @returns void
   */
  selectWallet: (wallet: string, keyPair?: KeyringPair) => void;
  /**
   * Select an address.
   * @param account the address to select
   * @returns void
   */
  selectAccount: (account: string) => void;
  /**
   * Disconnect the wallet.
   * @returns void
   */
  disconnectWallet: () => void;
  /**
   * Set if proxy execution is enabled.
   */
  setProxyFor: (real: string, conf: ProxyConfig) => void;
  /**
   * Get the proxy config for an address(real).
   */
  getProxyFor: (address?: string) => ProxyConfig | undefined;
  /**
   * Sign a raw transaction.
   */
  signRaw: (data: string) => Promise<string | undefined>;
};

export type ProxyConfig = {
  enabled: boolean;
  address: string;
};

/**
 * State type of user wallet config.
 */
export type WalletUserConfig = Partial<{
  walletId: string;
  selectedAddress: string;
  proxyFor?: Record<string, ProxyConfig | undefined>;
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
  wallet?: BaseDotsamaWallet | KeyringPairOrExtSigner;
  /**
   * The accounts of the current wallet.
   */
  accounts: InjectedAccount[];
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
export const walletAtom = atom<WalletState>({
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
export const userConfigAtom = persistentAtom<WalletUserConfig>({
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
        let selectedAddress =
          globalThis.localStorage?.getItem("accountAddress");

        globalThis.localStorage?.removeItem("walletId");
        globalThis.localStorage?.removeItem("accountAddress");

        if (selectedAddress?.match(/\".+\"/)) {
          selectedAddress = selectedAddress.replace(/\"/g, "");
        }

        if (
          selectedAddress &&
          tryCatch(() => encodeAddress(selectedAddress!)).isNone()
        ) {
          console.log("Invalid address in localStorage, disconnecting wallet.");
          return {};
        }

        return {
          walletId: walletId ?? undefined,
          selectedAddress: selectedAddress ?? undefined,
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
  web3AuthWalletInstance,
];

let accountsSubscriptionUnsub: VoidFunction | undefined | null;

let currentErrorNotification: Readonly<Notification> | null = null;

/**
 * Enable a wallet by enabling the extension and setting the wallet atom state to connected.
 * Also starts subscribing to accounts on the extension and updates the accounts in state.
 *
 * @param walletId the id or wallet itself to enable
 * @returns Promise<boolean> - whether the wallet was enabled
 */

const enableWallet = async (walletId: string, keyPair?: KeyringPair) => {
  if (accountsSubscriptionUnsub) accountsSubscriptionUnsub();

  if (
    (walletId === "web3auth" && !keyPair) ||
    (walletId === "walletconnect" && !keyPair)
  ) {
    return;
  }

  if (walletId === "walletconnect" && keyPair) {
    store.set(walletAtom, (state) => {
      return {
        ...state,
        wallet: { ...keyPair },
        connected: true,
        walletId: "web3auth",
        accounts:
          [keyPair].map((account) => {
            return {
              address: account,
            };
          }) ?? [],
        errors:
          [keyPair?.address].length === 0
            ? [
                {
                  extensionName: "walletconnect",
                  type: "NoAccounts",
                },
              ]
            : [],
      };
    });
    return;
  }

  if (walletId === "web3auth" && keyPair) {
    store.set(walletAtom, (state) => {
      return {
        ...state,
        wallet: { ...keyPair },
        connected: true,
        walletId: "web3auth",
        accounts:
          [keyPair?.address].map((account) => {
            return {
              address: encodeAddress(account, 73),
            };
          }) ?? [],
        errors:
          [keyPair?.address].length === 0
            ? [
                {
                  extensionName: "web3auth",
                  type: "NoAccounts",
                },
              ]
            : [],
      };
    });
    return;
  }

  const wallet = supportedWallets.find((w) => w.extensionName === walletId);

  if (!isPresent(wallet)) {
    return;
  }

  const enablePoll = async (): Promise<void> => {
    try {
      const extension = await poll(
        async () => {
          await cryptoWaitReady();
          await wallet.enable(DAPP_NAME);
          return wallet;
        },
        {
          interval: 66,
          timeout: 10_000,
        },
      );
      if (extension === PollingTimeout) {
        throw new Error("Wallet enabling timed out");
      }
    } catch (err) {
      throw wallet.transformError(err);
    }
  };

  try {
    store.set(walletAtom, (state) => {
      return {
        ...state,
        connected: false,
      };
    });

    await enablePoll();

    store.set(walletAtom, (state) => {
      return {
        ...state,
        wallet,
      };
    });

    accountsSubscriptionUnsub = await wallet?.subscribeAccounts((accounts) => {
      store.set(walletAtom, (state) => {
        const hasConnectedEthereumAccount = accounts?.some((account) => {
          if ((account as any).type?.toLowerCase() === "ethereum") {
            return true;
          }
        });

        if (hasConnectedEthereumAccount) {
          currentErrorNotification = pushNotification(
            <div>
              <div className="mb-1">Ethereum accounts are unsupported.</div>
              <div className="text-xs text-gray-500">
                You have a ethereum account connected in your{" "}
                {wallet.extensionName} wallet but it will be filtered out as it
                is not supported.
              </div>
            </div>,
            {
              autoRemove: true,
              lifetime: 20_000,
              type: "Error",
            },
          );
        } else if (currentErrorNotification) {
          removeNotification(currentErrorNotification);
        }

        return {
          ...state,
          connected: Boolean(accounts && accounts.length > 0),
          accounts:
            accounts
              ?.map((account) => {
                try {
                  return {
                    ...account,
                    address: encodeAddress(account.address, 73),
                  };
                } catch (error) {
                  return null;
                }
              })
              .filter(isNotNull) ?? [],
          errors: [
            accounts?.length === 0
              ? ({
                  extensionName: wallet.extensionName,
                  type: "NoAccounts",
                } satisfies WalletError)
              : null,
          ].filter(isNotNull),
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
            extensionName: wallet?.extensionName ?? "unknown wallet",
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
const initialWalletId = store.get(userConfigAtom).walletId;
if (initialWalletId) {
  enableWallet(initialWalletId);
}

/**
 * Hook for interacting with the wallet.
 * @returns UseWallet
 */
export const useWallet = (): UseWallet => {
  const [userConfig, setUserConfig] = useAtom(userConfigAtom);
  const [walletState, setWalletState] = useAtom(walletAtom);

  const selectWallet = (
    wallet: BaseDotsamaWallet | string,
    keyPair?: KeyringPair,
  ) => {
    setUserConfig({
      ...userConfig,
      walletId: isString(wallet) ? wallet : wallet.extensionName,
    });
    if (wallet === "web3auth" || wallet === "walletconnect") {
      enableWallet(wallet, keyPair);
    } else {
      enableWallet(isString(wallet) ? wallet : wallet.extensionName);
    }
  };

  const disconnectWallet = async () => {
    const [newWalletState, newUserConfigState] =
      disconnectWalletStateTransition(walletState, userConfig);
    setWalletState(newWalletState);
    setUserConfig(newUserConfigState);
  };

  const getSigner = (): KeyringPairOrExtSigner | undefined => {
    if (!walletState.wallet) {
      return;
    }
    if (walletState.wallet instanceof BaseDotsamaWallet) {
      return {
        address: activeAccount?.address,
        signer: walletState.wallet.signer,
      };
    }
    return walletState.wallet;
  };

  const selectAccount = (account: InjectedAccount | string) => {
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

  const setProxyFor = (address: string, proxyFor: ProxyConfig) => {
    setUserConfig({
      ...userConfig,
      proxyFor: {
        ...userConfig.proxyFor,
        [address]: proxyFor,
      },
    });
  };

  const getProxyFor = (address: string): ProxyConfig | undefined => {
    return userConfig.proxyFor?.[address];
  };

  const activeAccount = useMemo(() => {
    const userSelectedAddress = walletState.accounts.find((acc) => {
      console.log(acc.address);
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

  const proxy = userConfig.proxyFor?.[activeAccount?.address];
  const realAddress =
    proxy?.enabled && proxy?.address ? proxy?.address : activeAccount?.address;

  const isNovaWallet: boolean =
    typeof window === "object" && (window as any).walletExtension?.isNovaWallet;

  const walletId = userConfig.walletId;

  const signRaw = async (data: string) => {
    if (walletState.wallet instanceof BaseDotsamaWallet) {
      return walletState.wallet.signer
        ?.signRaw?.({
          address: activeAccount?.address,
          data: stringToHex(data),
          type: "bytes",
        })
        .then((data) => data.signature);
    }

    if (walletState.wallet && "sign" in walletState.wallet) {
      const u8 = walletState.wallet.sign(data, {});
      return u8aToHex(u8);
    }
  };

  return {
    ...walletState,
    ...userConfig,
    realAddress,
    selectAccount,
    activeAccount: activeAccount,
    getSigner,
    selectWallet,
    disconnectWallet,
    isNovaWallet,
    walletId,
    setProxyFor,
    getProxyFor,
    signRaw,
  };
};
