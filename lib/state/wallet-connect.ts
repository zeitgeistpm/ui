import { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { WalletConnectModal } from "@walletconnect/modal";
import { SessionTypes } from "@walletconnect/types";
import {
  IUniversalProvider,
  UniversalProvider,
} from "@walletconnect/universal-provider";
import { WalletConnectSigner } from "lib/util/wallet-connect-signer";
import { ZTG_CHAIN_ID } from "lib/constants";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
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

if (!WC_PROJECT_ID) {
  throw new Error("Missing WalletConnect project ID");
}

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
    if (!this._extension || !this._extension.events) {
      console.error("Extension or event emitter is not initialized.");
      return;
    }

    try {
      const initialAccounts = await this.getAccounts();
      callback(initialAccounts);
    } catch (error) {
      console.error("Error fetching initial accounts:", error);
    }

    const handleAccountsChanged = async () => {
      try {
        const updatedAccounts = await this.getAccounts();
        callback(updatedAccounts);
      } catch (error) {
        console.error(
          "Error fetching updated accounts on accountsChanged event:",
          error,
        );
      }
    };

    this._extension.events.on("accountsChanged", handleAccountsChanged);

    return () => {
      this._extension?.events.off("accountsChanged", handleAccountsChanged);
    };
  };
}
