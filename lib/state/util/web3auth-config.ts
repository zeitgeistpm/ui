import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { atom } from "jotai";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { TypeOfLogin } from "@web3auth/openlogin-adapter";
import { environment } from "lib/constants/index";

interface LoginConfig {
  [key: string]: {
    verifier: string;
    verifierSubIdentifier: string;
    typeOfLogin: TypeOfLogin;
    clientId: string;
  };
}

export const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_WSX;
const auth0ClientID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID_WSX;
const discordClientID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID_WSX;

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

export const web3authNoModal =
  clientId && clientId.length > 0
    ? new Web3AuthNoModal({
        clientId,
        chainConfig,
        web3AuthNetwork:
          environment === "production" ? "sapphire_mainnet" : "sapphire_devnet",
      })
    : null;

const privateKeyProvider = new CommonPrivateKeyProvider({
  config: { chainConfig },
});

const loginConfig: LoginConfig = {
  ...(auth0ClientID
    ? {
        auth0google: {
          verifier: "auth-aggregate",
          verifierSubIdentifier: "auth0-google",
          typeOfLogin: "jwt",
          clientId: auth0ClientID,
        },
        auth0twitter: {
          verifier: "auth-aggregate",
          verifierSubIdentifier: "auth0-twitter",
          typeOfLogin: "jwt",
          clientId: auth0ClientID,
        },
        auth0emailpasswordless: {
          verifier: "auth-aggregate",
          verifierSubIdentifier: "auth0-passwordless",
          typeOfLogin: "jwt",
          clientId: auth0ClientID,
        },
      }
    : {}),
  ...(discordClientID
    ? {
        discord: {
          verifier: "auth-aggregate",
          verifierSubIdentifier: "discord",
          typeOfLogin: "discord",
          clientId: discordClientID,
        },
      }
    : {}),
};

export const openloginAdapter = new OpenloginAdapter({
  privateKeyProvider,
  adapterSettings: {
    clientId,
    loginConfig,
  },
});

export const web3authAtom = atom<Web3AuthNoModal | null>(web3authNoModal);
