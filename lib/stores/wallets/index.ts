import { KeyringPair } from "@polkadot/keyring/types";
import keyring from "@polkadot/ui-keyring";
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import Store from "lib/stores/Store";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import { PolkadotjsWallet } from "./polkadotjs-wallet";
import { SubWallet } from "./subwallet";
import { TalismanWallet } from "./talisman-wallet";
import { Wallet, WalletAccount } from "./types";
import { proxy, subscribe, useSnapshot } from "valtio";
import { persistentProxy } from "lib/state/util/persistent-proxy";
import { derive, useProxy } from "valtio/utils";
import { sdkProxy, useSdkv2 } from "lib/hooks/useSdkv2";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useMemo } from "react";
import { isString } from "lodash-es";
import { DeepReadonly } from "lib/types/deep-readonly";

export type UseWallet = DeepReadonly<
  typeof walletStateProxy &
    typeof selectedAddressProxy &
    typeof selectedWalletIdProxy & {
      activeBalance: Decimal;
      setActiveAccount: (account: WalletAccount | string) => void;
      activeAccount?: WalletAccount;
      getActiveSigner: () => KeyringPairOrExtSigner | null;
      connectWallet: (wallet: Wallet | string) => Promise<void>;
      disconnectWallet: () => void;
    }
>;

export type WalletState = {
  connected: boolean;
  wallet?: Wallet;
  accounts: WalletAccount[];
  activeBalanceString: string;
  errorMessages: WalletErrorMessage[];
};

export type WalletErrorMessage = {
  extensionName: string;
  message: string;
};

export const supportedWallets = [
  new PolkadotjsWallet(),
  new SubWallet(),
  new TalismanWallet(),
];

const selectedAddressProxy = persistentProxy<{ selectedAddress?: string }>(
  "selected-account",
  { selectedAddress: globalThis.localStorage?.getItem("accountAddress") },
);

const selectedWalletIdProxy = persistentProxy<{ walletId?: string }>(
  "selected-wallet-id",
  { walletId: globalThis.localStorage?.getItem("walletId") },
);

const walletStateProxy = proxy<WalletState>({
  connected: false,
  wallet: undefined,
  accounts: [],
  activeBalanceString: null,
  errorMessages: [],
});

let balanceSubscriptionUnsub: VoidFunction | null = null;

subscribe(
  proxy({
    sdk: sdkProxy,
    selectedAddress: selectedAddressProxy,
  }),
  async () => {
    if (balanceSubscriptionUnsub) balanceSubscriptionUnsub();

    if (!selectedAddressProxy.selectedAddress) return;

    if (sdkProxy.sdk && isRpcSdk(sdkProxy.sdk)) {
      balanceSubscriptionUnsub = await sdkProxy.sdk.api.query.system.account(
        selectedAddressProxy.selectedAddress,
        ({ data: { free, miscFrozen } }) => {
          walletStateProxy.activeBalanceString = new Decimal(free.toString())
            .minus(miscFrozen.toString())
            .div(ZTG)
            .toString();
        },
      );
    }
  },
);

let accountsSubscriptionUnsub: VoidFunction | null = null;

const enableWallet = async (wallet: Wallet) => {
  try {
    if (accountsSubscriptionUnsub) accountsSubscriptionUnsub();

    walletStateProxy.connected = false;

    await wallet.enable();

    walletStateProxy.wallet = wallet;
    selectedWalletIdProxy.walletId = wallet.extensionName;

    accountsSubscriptionUnsub = await wallet.subscribeAccounts((accounts) => {
      if (accounts.length === 0) {
        walletStateProxy.accounts = [];
        walletStateProxy.errorMessages = [
          {
            extensionName: wallet.extensionName,
            message:
              "No accounts on this wallet. Please add account in wallet extension.",
          },
        ];
      } else {
        walletStateProxy.errorMessages = [];

        walletStateProxy.accounts = accounts.map((account) => {
          return {
            ...account,
            address: encodeAddress(account.address, 73),
          };
        });

        setTimeout(() => (walletStateProxy.connected = true), 33);
      }
    });

    return true;
  } catch (error) {
    walletStateProxy.accounts = [];
    walletStateProxy.errorMessages = [
      {
        extensionName: wallet.extensionName,
        message:
          "Not allowed to interact with extension. Please change permission settings.",
      },
    ];
    return false;
  }
};

if (selectedWalletIdProxy.walletId) {
  const wallet = supportedWallets.find(
    (w) => w.extensionName === selectedWalletIdProxy.walletId,
  );
  enableWallet(wallet);
}

export const useWallet = (): UseWallet => {
  const walletIdState = useSnapshot(selectedWalletIdProxy);
  const selectedAddressState = useSnapshot(selectedAddressProxy);
  const walletState = useSnapshot(walletStateProxy);

  const connectWallet = async (wallet: Wallet | string) => {
    if (isString(wallet)) {
      wallet = supportedWallets.find((w) => w.extensionName === wallet);
    }
    await enableWallet(wallet);
  };

  const disconnectWallet = () => {
    walletStateProxy.connected = false;
    walletStateProxy.accounts = [];
    walletStateProxy.wallet = undefined;
    selectedAddressProxy.selectedAddress = undefined;
  };

  const activeAccount: WalletAccount | undefined = useMemo(() => {
    const userSelectedAddress = walletState.accounts.find((acc) => {
      return (
        selectedAddressState.selectedAddress &&
        encodeAddress(acc.address, 73) ===
          encodeAddress(selectedAddressState.selectedAddress, 73)
      );
    });

    if (!userSelectedAddress) {
      return walletState.accounts[0];
    }

    return userSelectedAddress;
  }, [selectedAddressState.selectedAddress, walletState.accounts]);

  const getActiveSigner = (): KeyringPairOrExtSigner | null => {
    if (walletState.wallet == null || !activeAccount) return;
    return {
      address: activeAccount?.address,
      signer: walletState.wallet.signer,
    };
  };

  const setActiveAccount = (account: WalletAccount | string) => {
    if (typeof account === "string") {
      selectedAddressProxy.selectedAddress = account;
    } else {
      selectedAddressProxy.selectedAddress = account.address;
    }
  };

  const activeBalance = useMemo(
    () =>
      new Decimal(
        walletState.activeBalanceString ? walletState.activeBalanceString : 0,
      ),
    [walletState.activeBalanceString],
  );

  return {
    ...walletState,
    ...selectedAddressState,
    ...walletIdState,
    setActiveAccount,
    activeAccount,
    connectWallet,
    disconnectWallet,
    getActiveSigner,
    activeBalance,
  };
};
