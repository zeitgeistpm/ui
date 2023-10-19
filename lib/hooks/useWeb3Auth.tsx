import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { useEffect, useState } from "react";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { Keyring } from "@polkadot/api";
import { useWallet } from "lib/state/wallet";
import { useAtom } from "jotai";
import { atom } from "jotai";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import { providerAtom, web3authAtom } from "lib/state/wallet";

//Web3 Auth Instance for Wallet Select Details
export class Web3AuthWallet extends BaseDotsamaWallet {
  constructor({ extensionName, title, installUrl, logo }) {
    super();
    this.extensionName = extensionName;
    this.title = title;
    this.installUrl = installUrl;
    this.logo = logo;
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

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_ZTG;

export const useWeb3Auth = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const web3AuthInstance = new Web3AuthWallet({
    extensionName,
    title,
    installUrl,
    logo: {
      src: logoSrc,
      alt: logoAlt,
    },
  });

  const logout = async () => {
    if (!web3auth) {
      console.log("no logout");
      return;
    }
    console.log(web3auth.status);
    if (web3auth.status === "connected") {
      await web3auth.logout();
    }
    setLoggedIn(false);
  };

  return {
    loggedIn,
    logout,
  };
};
