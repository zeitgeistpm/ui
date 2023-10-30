import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { atom } from "jotai";

export const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_ZTG ?? "";

class Web3AuthWallet extends BaseDotsamaWallet {
  constructor({ extensionName, title, installUrl, logo }) {
    super();
    this.extensionName = extensionName;
    this.title = title;
    this.installUrl = installUrl;
    this.logo = logo;
    this.signer;
  }
}

const extensionName = "web3auth";
const title = "Web3Auth";
const installUrl = "";
const logoSrc = "/web3auth.svg";
const logoAlt = "web 3 auth";

export const web3AuthWalletInstance = new Web3AuthWallet({
  extensionName,
  title,
  installUrl,
  logo: {
    src: logoSrc,
    alt: logoAlt,
  },
});

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  chainId: "0x1",
  rpcTarget: "https://rpc.polkadot.io/",
  displayName: "Polkadot Mainnet",
  blockExplorer: "https://explorer.polkascan.io/",
  ticker: "DOT",
  tickerName: "Polkadot",
};
export const web3AuthInstance = new Web3Auth({
  clientId,
  chainConfig,
  web3AuthNetwork: "cyan",
  // Settings for whitelabel version of web3auth modal
  // uiConfig: {
  //   loginMethodsOrder: [
  //     "google",
  //     "facebook",
  //     "twitter",
  //     "discord",
  //     "twitch",
  //     "email_passwordless",
  //   ],
  //   appName: "Zeitgeist",
  //   mode: "dark",
  //   logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
  //   logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
  //   defaultLanguage: "en",
  //   loginGridCol: 3,
  //   primaryButton: "externalLogin",
  // },
});

export const web3authAtom = atom<Web3Auth | null>(web3AuthInstance);
