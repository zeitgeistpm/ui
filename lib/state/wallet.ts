import { encodeAddress } from "@polkadot/util-crypto";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/rpc";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";
import { atom, getDefaultStore, useAtom } from "jotai";
import { isString } from "lodash-es";
import { useMemo } from "react";
import { persistentAtom } from "./util/persistent-atom";
import {
  BaseDotsamaWallet,
  PolkadotjsWallet,
  SubWallet,
  TalismanWallet,
} from "@talismn/connect-wallets";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { InjectedAccount } from "@polkadot/extension-inject/types";
import { isPresent } from "lib/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { useEffect, useState } from "react";
import { Signer } from "@polkadot/api/types";
import { PollingTimeout, poll } from "lib/util/poll";

//Web3Auth
import { web3authAtom, providerAtom } from "./util/web3auth-config";
import {
  Web3AuthWallet,
  web3AuthWalletInstance,
  web3AuthInstance,
  clientId,
} from "./util/web3auth-config";
import { Web3Auth } from "@web3auth/modal";

const DAPP_NAME = "zeitgeist";

export type ExtendedKeyringPair = KeyringPair & { extensionName?: string };

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
   * Get the active signer for transactions. Is either the real account or the proxy account.
   */
  getSigner: (walletId?: string) => KeyringPairOrExtSigner | undefined;
  /**
   * Select a wallet.
   * @param wallet the selected wallet id or instance
   * @returns void
   */
  selectWallet: (wallet: string) => void;
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
   * Stores walletId to identify the wallet
   */
  walletId?: string;
  /**
   * Sets up web3 auth
   */
  initWeb3Auth: () => void;
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
  wallet?: BaseDotsamaWallet | Web3AuthWallet;
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
  console.log(userConfig);
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
      console.log(state);
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

/**
 * Enable a wallet by enabling the extension and setting the wallet atom state to connected.
 * Also starts subscribing to accounts on the extension and updates the accounts in state.
 *
 * @param walletId the id or wallet itself to enable
 * @returns Promise<boolean> - whether the wallet was enabled
 */

const enableWallet = async (walletId: string) => {
  console.log(walletId);
  if (accountsSubscriptionUnsub) accountsSubscriptionUnsub();

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
        return {
          ...state,
          connected: Boolean(accounts && accounts.length > 0),
          accounts:
            accounts?.map((account) => {
              return {
                ...account,
                address: encodeAddress(account.address, 73),
              };
            }) ?? [],
          errors:
            accounts?.length === 0
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
            extensionName: wallet?.extensionName ?? "unknown wallet",
            type: "InteractionDenied",
          },
        ],
      };
    });
    return false;
  }
};

const enabledWeb3Wallet = (keyPair: KeyringPair) => {
  store.set(walletAtom, (state) => {
    return {
      ...state,
      wallet: { ...keyPair },
      connected: true,
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
};

/**
 * Enable wallet on first load if wallet id is set.
 */
const initialWalletId = store.get(userConfigAtom).walletId;
if (initialWalletId) {
  initialWalletId !== "web3auth" && enableWallet(initialWalletId);
}

/**
 * Hook for interacting with the wallet.
 * @returns UseWallet
 */
export const useWallet = (): UseWallet => {
  const [userConfig, setUserConfig] = useAtom(userConfigAtom);
  const [walletState, setWalletState] = useAtom(walletAtom);
  const [web3auth, setWeb3auth] = useAtom(web3authAtom);
  const [provider, setProvider] = useAtom(providerAtom);

  //Gets web3auth keypair after provider is set
  useEffect(() => {
    loadWeb3Wallet();
    console.log("provider loading...");
  }, [provider]);

  // useEffect(() => {
  //   console.log(userConfig, walletState);
  // }, [userConfig]);

  const loadWeb3Wallet = async () => {
    if (!provider) {
      return;
    } else {
      const init = async () => {
        let keyPair = await getWeb3Accounts();
        if (keyPair) enabledWeb3Wallet(keyPair);
      };
      init();
    }
  };

  const onGetWeb3PolkadotKeypair = async () => {
    if (!provider) {
      return;
    }
    await cryptoWaitReady();
    const privateKey = (await provider.request({
      method: "private_key",
    })) as string;
    const keyring = new Keyring({ ss58Format: 42, type: "sr25519" });
    const keyPair = keyring.addFromUri("0x" + privateKey);
    return keyPair;
  };

  const getWeb3Accounts = async () => {
    if (!provider) {
      return;
    }
    const keyPair = await onGetWeb3PolkadotKeypair();
    return keyPair;
  };

  const loginWeb3Wallet = async () => {
    console.log(web3auth);
    if (!web3auth) {
      return;
    }
    // if (web3auth.status === "connected") {
    //   await web3auth.logout();
    // }
    console.log("login");
    web3auth.status === "not_ready" && (await web3auth.initModal());
    await web3auth.connect();
    setProvider(web3auth.provider);
  };

  const initWeb3Auth = async () => {
    if (clientId) {
      try {
        const walletId = userConfig.walletId;
        // setWeb3auth(web3AuthInstance);
        console.log(web3AuthInstance, walletId);
        walletId === "web3auth" && loginWeb3Wallet();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const selectWallet = (wallet: BaseDotsamaWallet | string) => {
    console.log(userConfig, wallet);
    setUserConfig({
      ...userConfig,
      walletId: isString(wallet) ? wallet : wallet.extensionName,
    });
    wallet === "web3auth"
      ? loginWeb3Wallet()
      : enableWallet(isString(wallet) ? wallet : wallet.extensionName);
  };

  const disconnectWallet = async () => {
    const [newWalletState, newUserConfigState] =
      disconnectWalletStateTransition(walletState, userConfig);
    console.log(newWalletState, newUserConfigState);
    setWalletState(newWalletState);
    setUserConfig(newUserConfigState);
    if (web3auth?.status === "connected") {
      console.log("logout");
      await web3auth.logout();
    }
  };

  const getSigner = (walletId?: string): KeyringPairOrExtSigner | undefined => {
    if (
      walletId === "web3auth" &&
      activeAccount.address &&
      walletState.wallet
    ) {
      return {
        address: activeAccount.address,
        signer: walletState.wallet as Signer,
      };
    }
    if (
      walletState.wallet == null ||
      !activeAccount ||
      !walletState.wallet.signer
    )
      return;
    return {
      address: activeAccount.address,
      signer: walletState.wallet.signer,
    };
  };

  const selectAccount = (account: InjectedAccount | string) => {
    console.log(account);
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
    console.log(address, proxyFor);
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

  return {
    ...walletState,
    ...userConfig,
    realAddress,
    selectAccount,
    activeAccount: activeAccount,
    initWeb3Auth,
    getSigner,
    selectWallet,
    disconnectWallet,
    isNovaWallet,
    setProxyFor,
    getProxyFor,
  };
};
