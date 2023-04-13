import { encodeAddress } from "@polkadot/util-crypto";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { atom, getDefaultStore, useAtom } from "jotai";
import { isString } from "lodash-es";
import { useMemo } from "react";
import { PolkadotjsWallet } from "../wallets/polkadotjs-wallet";
import { SubWallet } from "../wallets/subwallet";
import { TalismanWallet } from "../wallets/talisman-wallet";
import { Wallet, WalletAccount } from "../wallets/types";
import { persistentAtom } from "./util/persistent-atom";

export type UseWallet = WalletState & {
  selectedAddress?: string;
  activeAccount?: WalletAccount;
  selectWallet: (wallet: Wallet | string) => Promise<void>;
  selectAddress: (account: string) => void;
  getActiveSigner: () => KeyringPairOrExtSigner | null;
  disconnectWallet: () => void;
};

export type WalletState = {
  connected: boolean;
  wallet?: Wallet;
  accounts: WalletAccount[];
  errorMessages: WalletErrorMessage[];
};

const store = getDefaultStore();

const walletAtom = atom<WalletState>({
  connected: false,
  wallet: undefined,
  accounts: [],
  errorMessages: [],
});

export type WalletUserConfig = Partial<{
  walletId: string;
  selectedAddress: string;
}>;

const userConfigAtom = persistentAtom<WalletUserConfig>({
  store,
  key: "wallet-user-config",
  initial: {},
  migrations: [
    (state: unknown): WalletUserConfig => {
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

export type WalletErrorMessage = {
  extensionName: string;
  message: string;
};

export const supportedWallets = [
  new PolkadotjsWallet(),
  new SubWallet(),
  new TalismanWallet(),
];

let accountsSubscriptionUnsub: VoidFunction | null = null;

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
      if (accounts.length === 0) {
        store.set(walletAtom, (state) => {
          return {
            ...state,
            accounts: [],
            errorMessages: [
              {
                extensionName: wallet.extensionName,
                message:
                  "No accounts on this wallet. Please add account in wallet extension.",
              },
            ],
          };
        });
      } else {
        store.set(walletAtom, (state) => {
          return {
            ...state,
            connected: true,
            accounts: accounts.map((account) => {
              return {
                ...account,
                address: encodeAddress(account.address, 73),
              };
            }),
            errorMessages: [],
          };
        });
      }
    });

    return true;
  } catch (error) {
    store.set(walletAtom, (state) => {
      return {
        ...state,
        accounts: [],
        errorMessages: [
          {
            extensionName: wallet.extensionName,
            message:
              "Not allowed to interact with extension. Please change permission settings.",
          },
        ],
      };
    });
    return false;
  }
};

if (store.get(userConfigAtom).walletId) {
  enableWallet(store.get(userConfigAtom).walletId);
}

store.sub(userConfigAtom, () => {
  const { walletId } = store.get(userConfigAtom);
  if (walletId) {
    enableWallet(walletId);
  }
});

export const useWallet = (): UseWallet => {
  const [userConfig, setUserConfig] = useAtom(userConfigAtom);
  const [walletState, setWalletState] = useAtom(walletAtom);

  const selectWallet = async (wallet: Wallet | string) => {
    setUserConfig({
      ...userConfig,
      walletId: isString(wallet) ? wallet : wallet.extensionName,
    });
  };

  const disconnectWallet = () => {
    setWalletState({
      ...walletState,
      connected: false,
      accounts: [],
      wallet: undefined,
    });
    setUserConfig({
      ...userConfig,
      walletId: undefined,
    });
  };

  const getActiveSigner = (): KeyringPairOrExtSigner | null => {
    if (walletState.wallet == null || !activeAccount) return;
    return {
      address: activeAccount?.address,
      signer: walletState.wallet.signer,
    };
  };

  const selectAddress = (account: WalletAccount | string) => {
    setUserConfig({
      ...userConfig,
      selectedAddress: isString(account) ? account : account.address,
    });
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

  return {
    ...walletState,
    selectedAddress: userConfig.selectedAddress,
    selectAddress,
    activeAccount,
    selectWallet,
    disconnectWallet,
    getActiveSigner,
  };
};
