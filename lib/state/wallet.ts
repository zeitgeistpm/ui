import { encodeAddress } from "@polkadot/util-crypto";
import { CHAIN_NAMESPACES } from "@web3auth/base";
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
import {
  web3AuthInstance,
  Web3AuthWallet,
  useWeb3Auth,
} from "../hooks/useWeb3Auth";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { useState, useEffect } from "react";

export const web3authAtom = atom<Web3Auth | null>(null);
export const providerAtom = atom<SafeEventEmitterProvider | null>(null);

import { PollingTimeout, poll } from "lib/util/poll";
import { load } from "fathom-client";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_ZTG;
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
  getSigner: () => KeyringPairOrExtSigner | undefined;
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
  initWeb3Auth: () => void;
  web3auth: Web3Auth | null;
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
  wallet?: BaseDotsamaWallet | Web3AuthWallet | KeyringPair;
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
  web3AuthInstance,
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
      console.log(state);
      return {
        ...state,
        connected: false,
      };
    });

    await enablePoll();

    store.set(walletAtom, (state) => {
      console.log(state);
      return {
        ...state,
        wallet,
      };
    });

    accountsSubscriptionUnsub = await wallet?.subscribeAccounts((accounts) => {
      console.log(accounts);
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
    console.log(error);
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
// if (initialWalletId) {
//   enableWallet(initialWalletId);
// }

/**
 * Hook for interacting with the wallet.
 * @returns UseWallet
 */
export const useWallet = (): UseWallet => {
  const [userConfig, setUserConfig] = useAtom(userConfigAtom);
  const [walletState, setWalletState] = useAtom(walletAtom);
  const [web3auth, setWeb3auth] = useAtom(web3authAtom);
  const [provider, setProvider] = useAtom(providerAtom);

  const enableWeb3Wallet = async () => {
    if (!web3auth) {
      console.log("no login");
      return;
    }
    await initWeb3Auth();
    await web3auth.initModal();
    if (web3auth.status === "connected") {
      await web3auth.logout();
    }
    const web3authProvider = await web3auth.connect();

    const onGetPolkadotKeypair = async () => {
      if (!web3authProvider) {
        return;
      }

      await cryptoWaitReady();

      const privateKey = (await web3authProvider.request({
        method: "private_key",
      })) as string;
      const keyring = new Keyring({ ss58Format: 42, type: "sr25519" });
      const wallet = keyring.addFromUri("0x" + privateKey);
      return wallet;
    };

    if (!web3authProvider) {
      return;
    }

    const keyPair = await onGetPolkadotKeypair();
    console.log(keyPair);
    if (!keyPair) {
      return;
    }
    store.set(walletAtom, (state) => {
      console.log(state);
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

  const initWeb3Auth = async () => {
    if (clientId) {
      try {
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.OTHER,
          chainId: "0x1",
          rpcTarget: "https://rpc.polkadot.io/",
          displayName: "Polkadot Mainnet",
          blockExplorer: "https://explorer.polkascan.io/",
          ticker: "DOT",
          tickerName: "Polkadot",
        };
        const web3authInstance = new Web3Auth({
          clientId,
          chainConfig,
          web3AuthNetwork: "sapphire_devnet",
          uiConfig: {
            loginMethodsOrder: [
              "google",
              "facebook",
              "twitter",
              "discord",
              "twitch",
              "email_passwordless",
            ],
            appName: "Zeitgeist",
            mode: "dark",
            logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
            logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
            defaultLanguage: "en",
            loginGridCol: 3,
            primaryButton: "externalLogin",
          },
        });
        setWeb3auth(web3authInstance);
        setProvider(web3authInstance.provider);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const selectWallet = (wallet: BaseDotsamaWallet | string) => {
    setUserConfig({
      ...userConfig,
      walletId: isString(wallet) ? wallet : wallet.extensionName,
    });
    wallet === "web3auth"
      ? enableWeb3Wallet()
      : enableWallet(isString(wallet) ? wallet : wallet.extensionName);
  };

  const disconnectWallet = async () => {
    const [newWalletState, newUserConfigState] =
      disconnectWalletStateTransition(walletState, userConfig);
    setWalletState(newWalletState);
    setUserConfig(newUserConfigState);
    if (web3auth?.status === "connected") {
      await web3auth.logout();
    }
  };

  const getSigner = (): KeyringPairOrExtSigner | undefined => {
    console.log(walletAtom);
    if (
      walletState.wallet == null ||
      !activeAccount ||
      !walletState.wallet.signer
    )
      return;
    return {
      address: activeAccount.address,
      signer: walletState.wallet.signer ?? walletState.wallet,
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
    web3auth,
    initWeb3Auth,
    getSigner,
    selectWallet,
    disconnectWallet,
    isNovaWallet,
    setProxyFor,
    getProxyFor,
  };
};
