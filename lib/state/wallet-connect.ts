import { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { WalletConnectModal } from "@walletconnect/modal";
import { SessionTypes } from "@walletconnect/types";
import {
  IUniversalProvider,
  UniversalProvider,
} from "@walletconnect/universal-provider";
import { WalletConnectSigner } from "lib/util/wallet-connect-signer";
import { ZTG_CHAIN_ID } from "lib/constants";

const WC_PROJECT_ID = "bc3373ccb16b53e7d5eb57672db4b4f8";
const DOMAIN_URL = "https://app.zeitgeist.pm/";

const walletConnectParams = {
  projectId: WC_PROJECT_ID,
  relayUrl: "wss://relay.walletconnect.com",
  metadata: {
    name: "Zeitgeist",
    description: "Zeitgeist",
    url: DOMAIN_URL,
    icons: ["https://walletconnect.com/walletconnect-logo.png"],
  },
};

const requiredNamespaces = {
  polkadot: {
    methods: ["polkadot_signTransaction", "polkadot_signMessage"],
    chains: [ZTG_CHAIN_ID],
    events: ["accountsChanged", "disconnect"],
  },
};

const chains = Object.values(requiredNamespaces)
  .map((namespace) => namespace.chains)
  .flat();

const modal = new WalletConnectModal({
  projectId: WC_PROJECT_ID,
  chains,
});

const provider = await UniversalProvider.init(walletConnectParams);

export class WalletConnect implements Wallet {
  extensionName = "walletconnect";
  title = "WalletConnect";
  installUrl = "";
  logo = {
    src: "/icons/walletconnect-icon.svg",
    alt: "WalletConnect Logo",
  };

  _extension: IUniversalProvider | undefined;
  _signer: WalletConnectSigner | undefined;
  _session: SessionTypes.Struct | undefined;

  constructor({
    onModalOpen,
    onModalClose,
  }: {
    onModalOpen?: () => void;
    onModalClose?: () => void;
  } = {}) {
    modal.subscribeModal((state) => {
      state.open ? onModalOpen?.() : onModalClose?.();
    });
  }

  get extension() {
    return this._extension;
  }

  get signer() {
    return this._signer;
  }

  get installed() {
    return true;
  }

  get rawExtension() {
    return provider;
  }

  close() {
    modal.closeModal();
  }

  transformError = (err: Error): Error => {
    return err;
  };

  enable = async (dappName: string) => {
    if (!dappName) {
      throw new Error("MissingParamsError: Dapp name is required.");
    }

    try {
      const { uri, approval } = await this.rawExtension.client.connect({
        requiredNamespaces,
      });

      if (uri) {
        await modal.openModal({ uri, chains });
      }

      const session = await approval();

      const client = this.rawExtension.client;

      this._extension = this.rawExtension;
      this._session = session;
      this._signer = new WalletConnectSigner(client, session, ZTG_CHAIN_ID);
    } finally {
      modal.closeModal();
    }
  };

  getAccounts = async (): Promise<WalletAccount[]> => {
    if (!this._session) {
      throw new Error(
        `The 'Wallet.enable(dappname)' function should be called first.`,
      );
    }

    const wcAccounts = Object.values(this._session.namespaces)
      .map((namespace) => namespace.accounts)
      .flat();

    return wcAccounts.map((wcAccount) => {
      const address = wcAccount.split(":")[2];
      return {
        address,
        source: this.extensionName,
        name: this.title,
        wallet: this,
        signer: this.signer,
      };
    });
  };

  subscribeAccounts = async (callback: (accounts: WalletAccount[]) => void) => {
    // Assuming this._extension or this._session has a method to subscribe to account changes
    this._extension?.on("accountsChanged", async () => {
      const accounts = await this.getAccounts();
      callback(accounts);
    });

    // You would also handle unsubscribing logic here, possibly returning a function to do so
  };
}
