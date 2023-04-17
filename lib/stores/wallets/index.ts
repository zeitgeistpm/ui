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
  accountAddress: string | null = null;
  activeAccount?: WalletAccount = undefined;
  enableIntervalId?: number;
  walletEnabled = false;
  errorMessages: WalletErrorMessage[] = [];
  activeBalance = new Decimal(0);
  accounts: WalletAccount[] = [];
  accountsChangeUnsub: any;
  connected = false;

  private balanceSubscription?: any;

  constructor(private store: Store) {
    makeAutoObservable(this, {}, { deep: false, autoBind: true });

    this.accountAddress =
      globalThis.localStorage?.getItem("accountAddress") ?? "";

    reaction(
      () => this.wallet,
      (wallet) => {
        localStorage.setItem("walletId", wallet?.extensionName ?? null);
      },
    );

    reaction(
      () => this.accountAddress,
      (address) => {
        localStorage.setItem("accountAddress", address);
      },
    );

    reaction(
      () => this.activeAccount,
      (account) => {
        this.accountAddress = account.address;
      },
    );

    reaction(
      () => this.accounts,
      (accounts) => {
        if (accounts.length > 0) {
          if (this.wallet) {
            this.unsetErrorMessage(this.wallet.extensionName);
          }
          let acc: typeof this.activeAccount;
          const storedAddress = this.accountAddress;
          if (storedAddress) {
            acc = accounts.find((acc) => acc.address === this.accountAddress);
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

  unsetActiveAccount() {
    this.activeBalance = new Decimal(0);
    this.activeAccount = undefined;
    this.accountAddress = null;
    if (this.balanceSubscription) {
      this.balanceSubscription();
      this.balanceSubscription = undefined;
    }
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

  setAccounts(accounts: WalletAccount[]) {
    this.accounts = accounts;
    if (!this.activeAccount) {
      this.activeAccount = accounts[0];
    }
  }

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

  get accountSelectOptions() {
    return this.accounts.map((account, id) => {
      return {
        label: account.name ?? `Account #${id}`,
        value: account.address,
      };
    });
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
    if (this.wallet == null || !this.activeAccount) return;

    const signer = this.wallet.signer;

    return { address: this.activeAccount?.address, signer: signer };
  }

  get testingKeyringPair(): KeyringPair | undefined {
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
      ({ data: { free, miscFrozen } }) => {
        runInAction(() => {
          this.activeBalance = new Decimal(free.toString())
            .minus(miscFrozen.toString())
            .div(ZTG);
        });
      },
    );
  }

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

  async initialize() {
    const walletId = localStorage.getItem("walletId");
    return this.connectWallet(walletId);
  }

  static get supportedWallets() {
    return supportedWallets;
  }
}
