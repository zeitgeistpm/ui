import keyring from "@polkadot/ui-keyring";
import Decimal from "decimal.js";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { PolkadotjsWallet } from "./polkadotjs-wallet";
import { SubWallet } from "./subwallet";
import { Wallet, WalletAccount } from "./types";
import { TalismanWallet } from "./talisman-wallet";
import Store from "lib/stores/Store";
import { ZTG } from "lib/constants";

const supportedWallets = [
  new PolkadotjsWallet(),
  new SubWallet(),
  new TalismanWallet(),
];

export const encodeAddresses = (
  accounts: WalletAccount[],
  ss58Prefix: number,
) => {
  return accounts.map((acc) => {
    return {
      ...acc,
      address: encodeAddress(decodeAddress(acc.address), ss58Prefix),
    };
  });
};

export type WalletErrorMessage = {
  extensionName: string;
  message: string;
};

const enableWalletLoop = async (
  wallet: Wallet,
  failCallback: () => void,
): Promise<void> => {
  const enableFunc = async () => {
    try {
      await wallet.enable();
      return true;
    } catch (err) {
      failCallback();
      return false;
    }
  };
  const enabled = await enableFunc();
  if (enabled) {
    return;
  }
  return new Promise((resolve) => {
    const id = window.setInterval(async () => {
      const enabled = await enableFunc();
      if (enabled) {
        window.clearInterval(id);
        resolve();
      }
    }, 1000);
  });
};

export default class Wallets {
  wallet?: Wallet | null;

  setWallet(wallet: Wallet | null) {
    this.wallet = wallet;
    if (this.accountsChangeUnsub) {
      this.accountsChangeUnsub();
    }
    if (wallet == null) {
      return;
    }
    wallet
      .subscribeAccounts((accounts) => {
        this.setAccounts(
          encodeAddresses(accounts, this.store.config.ss58Prefix),
        );
      })
      .then((unsub) => {
        runInAction(() => {
          this.accountsChangeUnsub = unsub;
        });
      });
  }

  getWalletByExtensionName(extensionName: string): Wallet | undefined {
    return supportedWallets.find((w) => w.extensionName === extensionName);
  }

  activeAccount: WalletAccount | null = null;

  setActiveAccount(account: WalletAccount | string | null) {
    if (this.balanceSubscription) {
      this.balanceSubscription();
    }
    if (account == null) {
      this.activeBalance = new Decimal(0);
      this.activeAccount = null;
      return;
    }
    if (typeof account === "string") {
      account = this.accounts.find((acc) => acc.address === account);
    }
    this.activeAccount = account;
    this.subscribeToBalanceChanges();
  }

  errorMessages: WalletErrorMessage[] = [];

  get faultyConnection() {
    return this.errorMessages.length > 0;
  }

  setErrorMessageForExtension(extensionName: string, message: string) {
    const idx = this.errorMessages.findIndex(
      (obj) => obj.extensionName === extensionName,
    );
    const err = { extensionName, message };
    if (idx === -1) {
      this.errorMessages = [...this.errorMessages, err];
    } else {
      this.errorMessages = [
        ...this.errorMessages.slice(0, idx),
        err,
        ...this.errorMessages.slice(idx + 1),
      ];
    }
    return err;
  }

  unsetErrorMessage(extensionName: string) {
    const idx = this.errorMessages.findIndex(
      (obj) => obj.extensionName === extensionName,
    );
    this.errorMessages = [
      ...this.errorMessages.slice(0, idx),
      ...this.errorMessages.slice(idx + 1),
    ];
  }

  accounts: WalletAccount[] = [];

  setAccounts(accounts: WalletAccount[]) {
    this.accounts = accounts;
  }

  accountsChangeUnsub: any;

  connected = false;

  setConnected(connected: boolean) {
    this.connected = connected;
  }

  activeBalance = new Decimal(0);

  private balanceSubscription;

  get accountSelectOptions() {
    return this.accounts.map((account, id) => {
      return {
        label: account.name ?? `Account #${id}`,
        value: account.address,
      };
    });
  }

  constructor(private store: Store) {
    makeAutoObservable(this, {}, { deep: false, autoBind: true });

    reaction(
      () => this.accounts,
      (accounts) => {
        if (accounts.length > 0) {
          this.unsetErrorMessage(this.wallet.extensionName);
          if (!this.activeAccount) {
            let defaultAccount: WalletAccount;
            const storedAddress = this.store.userStore.accountAddress;
            if (storedAddress) {
              defaultAccount = accounts.find(
                (acc) => acc.address === this.store.userStore.accountAddress,
              );
            } else {
              defaultAccount = accounts[0];
            }
            this.setActiveAccount(defaultAccount ?? accounts[0]);
          }
        } else {
          this.setActiveAccount(null);
        }
      },
    );
  }

  *getAccounts(wallet: Wallet) {
    const accounts: WalletAccount[] = yield wallet.getAccounts();

    if (accounts.length === 0) {
      this.setErrorMessageForExtension(
        wallet.extensionName,
        "No accounts on this wallet. Please add account in wallet extension.",
      );
      return;
    }

    let accs: WalletAccount[];
    if (this.store.config?.ss58Prefix) {
      accs = accounts.map((acc) => {
        return {
          ...acc,
          address: encodeAddress(
            decodeAddress(acc.address),
            this.store.config.ss58Prefix,
          ),
        };
      });
    } else {
      accs = accounts;
    }
    return accs;
  }

  getActiveSigner(): KeyringPairOrExtSigner | undefined {
    if (this.store.isTestEnv) {
      this.testingKeyringPair.unlock();
      return this.testingKeyringPair;
    }
    if (this.wallet == null) return;

    const signer = this.wallet.signer;

    return { address: this.activeAccount.address, signer: signer };
  }

  get testingKeyringPair(): KeyringPair | undefined {
    if (!this.store.isTestEnv) {
      return;
    }
    const pair = keyring.getPair(keyring.getAccounts()[0].address);
    return pair;
  }

  async subscribeToBalanceChanges() {
    const { sdk } = this.store;
    const { address } = this.activeAccount;

    this.balanceSubscription = await sdk.api.query.system.account(
      address,
      ({ data: { free: currentFree } }) => {
        runInAction(() => {
          this.activeBalance = new Decimal(currentFree.toString()).div(ZTG);
        });
      },
    );
  }

  disconnectWallet() {
    this.setWallet(null);
    this.setAccounts([]);
    this.setConnected(false);
  }

  // try to enable wallet every 1000 ms, and stop once the wallet is enabled
  *enableWallet(wallet: Wallet) {
    yield enableWalletLoop(wallet, () => {
      this.setErrorMessageForExtension(
        wallet.extensionName,
        "Not allowed to interact with extension. Please change permission settings and reload the page.",
      );
    });
    return true;
  }

  *connectWallet(extensionName?: string) {
    const wallet = this.getWalletByExtensionName(extensionName);

    if (!wallet || wallet.installed === false) {
      this.setWallet(null);
      return;
    }

    const enabled = yield this.enableWallet(wallet);

    this.setWallet(wallet);

    if (!enabled) {
      return this.errorMessages;
    }

    const accounts = yield this.getAccounts(wallet);

    if (!accounts) {
      return this.errorMessages;
    }

    if (accounts) {
      this.setAccounts(accounts);
      this.setConnected(true);
    }
  }

  async initialize() {
    const { userStore } = this.store;
    const storedWalletId = userStore.walletId;

    if (this.store.isTestEnv) {
      await cryptoWaitReady();

      keyring.loadAll({
        ss58Format: this.store.config.ss58Prefix,
        type: "sr25519",
      });

      const seed = process.env.NEXT_PUBLIC_TESTING_SEED;

      const acc = keyring.addUri(seed);

      const activeAccount: WalletAccount = {
        address: acc.pair.address,
        source: "ui-keyring",
      };

      (window as any).ACTIVE_ACCOUNT_ADDRESS = acc.pair.address;

      this.setActiveAccount(activeAccount);
      this.setConnected(true);
    } else {
      this.connectWallet(storedWalletId);
    }
  }

  static get supportedWallets() {
    return supportedWallets;
  }
}
