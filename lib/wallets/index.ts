import keyring from "@polkadot/ui-keyring";
import Decimal from "decimal.js";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import {
  decodeAddress,
  encodeAddress,
} from "@polkadot/util-crypto";
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
  ss58Prefix?: number,
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

export default class Wallets {
  wallet?: Wallet = undefined;

  setWallet(wallet: Wallet) {
    this.wallet = wallet;

    if (this.accountsChangeUnsub) {
      this.accountsChangeUnsub();
    }
    if (this.walletEnabled) {
      wallet
        .subscribeAccounts((accounts) => {
          if (accounts?.length) {
            this.setAccounts(
              encodeAddresses(accounts, this.store.config?.ss58Prefix),
            );
          } else {
            this.disconnectWallet();
          }
        })
        .then((unsub) => {
          runInAction(() => {
            this.accountsChangeUnsub = unsub;
          });
        });
    }
  }

  getWalletByExtensionName(extensionName?: string): Wallet | undefined {
    if (extensionName == null) {
      return;
    }
    return supportedWallets.find((w) => w.extensionName === extensionName);
  }

  activeAccount?: WalletAccount = undefined;

  unsetActiveAccount() {
    this.activeBalance = new Decimal(0);
    this.activeAccount = undefined;
    return;
  }

  setActiveAccount(account: WalletAccount | string) {
    let walletAcc: typeof this.activeAccount;
    if (typeof account === "string") {
      walletAcc = this.accounts.find((acc) => acc.address === account);
      if (walletAcc == null) {
        throw Error(`Cannot find a wallet for account: ${account} !`);
      }
      this.activeAccount = walletAcc;
    } else {
      this.activeAccount = account;
    }
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

  clearErrorMessages() {
    this.errorMessages = [];
  }

  accounts: WalletAccount[] = [];

  setAccounts(accounts: WalletAccount[]) {
    this.accounts = accounts;
    if (!this.activeAccount) {
      this.activeAccount = accounts[0];
    }
  }

  accountsChangeUnsub: any;

  connected = false;

  setConnected(connected: boolean) {
    this.connected = connected;
  }

  disconnectWallet() {
    this.walletEnabled = false;
    this.setConnected(false);
    this.unsetActiveAccount();
    if (this.balanceSubscription) {
      this.balanceSubscription();
      this.balanceSubscription = undefined;
    }
  }

  activeBalance = new Decimal(0);

  private balanceSubscription?: () => void;

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
          if (this.wallet) {
            this.unsetErrorMessage(this.wallet.extensionName);
          }
          let acc: typeof this.activeAccount;
          const storedAddress = this.store.userStore.accountAddress;
          if (storedAddress) {
            acc = accounts.find(
              (acc) => acc.address === this.store.userStore.accountAddress,
            );
          } else {
            acc = accounts[0];
          }
          if (acc == null) {
            acc = accounts[0];
          }
          this.setActiveAccount(acc);
        } else {
          this.unsetActiveAccount();
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

    if (this.balanceSubscription) {
      this.balanceSubscription();
    }

    this.balanceSubscription = await sdk.api.query.system.account(
      address,
      ({ data: { free: currentFree } }) => {
        runInAction(() => {
          this.activeBalance = new Decimal(currentFree.toString()).div(ZTG);
        });
      },
    );
  }

  enableIntervalId?: number;
  walletEnabled = false;

  get enablingInProgress() {
    return this.enableIntervalId != null;
  }

  stopEnableLoop() {
    if (this.enableIntervalId == null) {
      return;
    }
    window.clearInterval(this.enableIntervalId);
    this.enableIntervalId = undefined;
  }

  /**
   * @param wallet wallet to enable
   * @param interval true to try to connect in an endless loop cancelled by `stopEnableLoop`
   * @returns true if enabling went succesfull, otherwise fails silently
   */
  *enableWallet(wallet: Wallet, interval = false) {
    const enabled = yield this.enableWalletLoop(wallet, interval, () => {
      this.setErrorMessageForExtension(
        wallet.extensionName,
        "Not allowed to interact with extension. Please change permission settings.",
      );
    });
    if (enabled) {
      this.walletEnabled = true;
    }
    return enabled;
  }

  private enableWalletLoop = async (
    wallet: Wallet,
    interval = false,
    failCallback: () => void,
  ): Promise<boolean> => {
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
      return true;
    }
    if (interval) {
      return new Promise<boolean>((resolve, reject) => {
        const id = window.setInterval(async () => {
          const enabled = await enableFunc();
          if (enabled) {
            window.clearInterval(this.enableIntervalId);
            resolve(true);
          } else {
            // reject(false);
          }
        }, 1000);
        runInAction(() => {
          this.enableIntervalId = id;
        });
      });
    } else {
      return false;
    }
  };

  *connectWallet(extensionName: string, pollEnable = false) {
    this.walletEnabled = false;
    const wallet = this.getWalletByExtensionName(extensionName);

    if (wallet == null || !wallet.installed) {
      return;
    }

    this.stopEnableLoop();
    this.clearErrorMessages();

    const enabled = yield this.enableWallet(wallet, pollEnable);

    if (enabled !== true) {
      return this.errorMessages;
    }

    this.setWallet(wallet);

    const accounts = yield this.getAccounts(wallet);

    if (!accounts) {
      return this.errorMessages;
    }

    this.setConnected(true);
  }

  async initialize(extensionName: string) {
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
      this.connectWallet(extensionName);
    }
  }

  static get supportedWallets() {
    return supportedWallets;
  }
}
