import { WalletError } from "./errors/BaseWalletError";
import {
  InjectedMetadata,
  InjectedProvider,
  Unsubcall,
} from "@polkadot/extension-inject/types";
import { Signer as InjectedSigner } from "@polkadot/api/types";

export interface WalletLogoProps {
  // Logo url
  src: string;
  // Alt for the Logo url
  alt: string;
}

export interface WalletAccount {
  address: string;
  source: string;
  name?: string;
  wallet?: Wallet;
  signer?: unknown;
}

export type SubscriptionFn = (
  accounts: WalletAccount[] | undefined,
) => void | Promise<void>;

interface WalletExtension {
  installed: boolean | undefined;

  // The raw extension object which will have everything a dapp developer needs.
  // Refer to a specific wallet's extension documentation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extension: any;

  // The raw signer object for convenience. Usually the implementer can derive this from the extension object.
  // Refer to a specific wallet's extension documentation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: InjectedSigner | undefined;

  metadata: InjectedMetadata | undefined;

  provider: InjectedProvider | undefined;
}

interface WalletData {
  // The name of the wallet extension. Should match `Account.source`
  extensionName: string;
  // Display name for the wallet extension
  title: string;
  // Message to display if wallet extension is not installed
  noExtensionMessage?: string;
  // The URL to install the wallet extension
  installUrl: string;
  // The wallet logo
  logo: WalletLogoProps;
}

interface Connector {
  enable: () => unknown;

  // The subscribe to accounts function
  subscribeAccounts: (callback: SubscriptionFn) => Promise<Unsubcall | null>;

  getAccounts: () => Promise<WalletAccount[] | null>;
}

interface Signer {}

interface WalletErrors {
  transformError: (err: WalletError) => Error;
}

export interface Wallet
  extends WalletData,
    WalletExtension,
    Connector,
    Signer,
    WalletErrors {}
