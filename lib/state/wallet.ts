import { encodeAddress } from "@polkadot/util-crypto";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { persistentProxy } from "lib/state/util/persistent-proxy";
import { DeepReadonly } from "lib/types/deep-readonly";
import { isString } from "lodash-es";
import { useMemo } from "react";
import { proxy, subscribe, useSnapshot } from "valtio";
import { atom, useAtom, getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { PolkadotjsWallet } from "../wallets/polkadotjs-wallet";
import { SubWallet } from "../wallets/subwallet";
import { TalismanWallet } from "../wallets/talisman-wallet";
import { Wallet, WalletAccount } from "../wallets/types";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";

export type UseWallet = WalletState & {
  selectedAddress?: string;
  activeBalance: Decimal;
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
  activeBalanceString: string;
  errorMessages: WalletErrorMessage[];
};

const walletAtom = atom<WalletState>({
  connected: false,
  wallet: undefined,
  accounts: [],
  activeBalanceString: null,
  errorMessages: [],
});

const selectedAddressAtom = atomWithStorage<string | undefined>(
  "selected-address",
  undefined,
);

const selectedWalletIdAtom = atomWithStorage<string | undefined>(
  "selected-wallet-id",
  undefined,
);

const store = getDefaultStore();

export type WalletErrorMessage = {
  extensionName: string;
  message: string;
};

export const supportedWallets = [
  new PolkadotjsWallet(),
  new SubWallet(),
  new TalismanWallet(),
];

// let balanceSubscriptionUnsub: VoidFunction | null = null;

// subscribe(
//   proxy({
//     sdk: sdkProxy,
//     selectedAddress: selectedAddressProxy,
//   }),
//   async () => {
//     if (balanceSubscriptionUnsub) balanceSubscriptionUnsub();

//     if (!selectedAddressProxy.selectedAddress) return;

//     if (sdkProxy.sdk && isRpcSdk(sdkProxy.sdk)) {
//       balanceSubscriptionUnsub = await sdkProxy.sdk.api.query.system.account(
//         selectedAddressProxy.selectedAddress,
//         ({ data: { free, miscFrozen } }) => {
//           walletStateProxy.activeBalanceString = new Decimal(free.toString())
//             .minus(miscFrozen.toString())
//             .div(ZTG)
//             .toString();
//         },
//       );
//     }
//   },
// );

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

setTimeout(() => {
  const walletId = store.get(selectedWalletIdAtom);
  if (walletId) {
    enableWallet(walletId);
  } else if (accountsSubscriptionUnsub) {
    accountsSubscriptionUnsub();
  }
});

store.sub(selectedWalletIdAtom, () => {
  const walletId = store.get(selectedWalletIdAtom);
  if (walletId) {
    enableWallet(walletId);
  }
});

export const useWallet = (): UseWallet => {
  const [_, setSelectedWalletId] = useAtom(selectedWalletIdAtom);
  const [selectedAddress, setSelectedAddress] = useAtom(selectedAddressAtom);
  const [walletState, setWalletState] = useAtom(walletAtom);

  const { data: activeBalance } = useZtgBalance(selectedAddress);

  const selectWallet = async (wallet: Wallet | string) => {
    setSelectedWalletId(isString(wallet) ? wallet : wallet.extensionName);
  };

  const disconnectWallet = () => {
    setWalletState({
      ...walletState,
      connected: false,
      accounts: [],
      wallet: undefined,
    });
    setSelectedWalletId(undefined);
  };

  const getActiveSigner = (): KeyringPairOrExtSigner | null => {
    if (walletState.wallet == null || !activeAccount) return;
    return {
      address: activeAccount?.address,
      signer: walletState.wallet.signer,
    };
  };

  const selectAddress = (account: WalletAccount | string) => {
    if (typeof account === "string") {
      setSelectedAddress(account);
    } else {
      setSelectedAddress(account.address);
    }
  };

  const activeAccount: WalletAccount | undefined = useMemo(() => {
    const userSelectedAddress = walletState.accounts.find((acc) => {
      return (
        selectedAddress &&
        encodeAddress(acc.address, 73) === encodeAddress(selectedAddress, 73)
      );
    });

    if (!userSelectedAddress) {
      return walletState.accounts[0];
    }

    return userSelectedAddress;
  }, [selectedAddress, walletState.accounts]);

  return {
    ...walletState,
    selectedAddress,
    selectAddress,
    activeAccount,
    selectWallet,
    disconnectWallet,
    getActiveSigner,
    activeBalance: activeBalance?.div(ZTG) ?? new Decimal(0),
  };
};
