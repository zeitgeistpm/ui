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

export const web3AuthInstance = new Web3AuthWallet({
  extensionName,
  title,
  installUrl,
  logo: {
    src: logoSrc,
    alt: logoAlt,
  },
});

export const web3authAtom = atom<Web3Auth | null>(null);
export const providerAtom = atom<SafeEventEmitterProvider | null>(null);

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_ZTG;

export const useWeb3Auth = () => {
  const [web3auth, setWeb3auth] = useAtom(web3authAtom);
  const [provider, setProvider] = useAtom(providerAtom);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const { selectWallet, loadWeb3Wallet } = useWallet();

  useEffect(() => {
    loadWallet();
  }, [loggedIn]);

  const loadWallet = async () => {
    if (!provider || !loggedIn) {
      return;
    } else {
      const init = async () => {
        if (!provider) {
          await initWeb3Auth();
        }
        // let wallet = await getAccounts();
        // const extendedWallet = {
        //   ...wallet,
        //   extensionName: "web3auth",
        // };
        // selectWallet(extendedWallet);
        let wallet = await getAccounts();
        console.log(wallet);
        wallet && loadWeb3Wallet(wallet);
      };
      init();
    }
  };

  const initWeb3Auth = async () => {
    if (clientId) {
      try {
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.OTHER,
          chainId: "0x1",
          rpcTarget: "https://rpc.polkadot.io/",
          displayName: "Polkadot Mainnet",
          blockExplorer: "https://explorer.polkascan.io/",
          ticker: "DOT",
          tickerName: "Polkadot",
        };
        const web3authInstance = new Web3Auth({
          clientId,
          chainConfig,
          web3AuthNetwork: "sapphire_devnet",
          uiConfig: {
            loginMethodsOrder: [
              "google",
              "facebook",
              "twitter",
              "discord",
              "twitch",
              "email_passwordless",
            ],
            appName: "Zeitgeist",
            mode: "dark",
            logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
            logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
            defaultLanguage: "en",
            loginGridCol: 3,
            primaryButton: "externalLogin",
          },
        });
        setWeb3auth(web3authInstance);
        setProvider(web3authInstance.provider);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const login = async () => {
    if (!web3auth) {
      console.log("no login");
      return;
    }
    await initWeb3Auth();
    await web3auth.initModal();
    if (web3auth.status === "connected") {
      await web3auth.logout();
    }
    const web3authProvider = await web3auth.connect();

    setProvider(web3authProvider);
    setLoggedIn(true);
  };

  const authenticateUser = async () => {
    if (!web3auth) {
      return;
    }
    const idToken = await web3auth.authenticateUser();
  };

  const logout = async () => {
    if (!web3auth) {
      console.log("no logout");
      return;
    }
    console.log(web3auth.status);
    if (web3auth.status === "connected") {
      await web3auth.logout();
    }
    setProvider(null);
    setLoggedIn(false);
  };

  const onGetPolkadotKeypair = async () => {
    if (!provider) {
      return;
    }
    await cryptoWaitReady();
    const privateKey = (await provider.request({
      method: "private_key",
    })) as string;
    const keyring = new Keyring({ ss58Format: 42, type: "sr25519" });
    const keyPair = keyring.addFromUri("0x" + privateKey);
    return keyPair;
  };

  const getAccounts = async () => {
    if (!provider) {
      return;
    }
    const keyPair = await onGetPolkadotKeypair();
    return keyPair;
  };

  return {
    web3auth,
    provider,
    loggedIn,
    loadWallet,
    initWeb3Auth,
    login,
    logout,
    onGetPolkadotKeypair,
    authenticateUser,
    getAccounts,
  };
};
