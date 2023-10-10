import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { useEffect, useState } from "react";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { Keyring } from "@polkadot/api";
import { useWallet } from "lib/state/wallet";
import { useAtom } from "jotai";
import { atom } from "jotai";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { BaseDotsamaWallet } from "@talismn/connect-wallets";

//Web3 Auth Instance for Wallet Select Details
class Web3AuthWallet extends BaseDotsamaWallet {
  constructor({ extensionName, title, installUrl, logo }) {
    super();
    this.extensionName = extensionName;
    this.title = title;
    this.installUrl = installUrl;
    this.logo = logo;
  }
}

const extensionName = "web3auth";
const title = "Web 3 Auth";
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

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

export const useWeb3Auth = () => {
  const [web3auth, setWeb3auth] = useAtom(web3authAtom);
  const [provider, setProvider] = useAtom(providerAtom);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [newUser, setNewUser] = useState<boolean>(false);

  const { selectWallet, disconnectWallet } = useWallet();

  useEffect(() => {
    loadWallet();
  }, [loggedIn]);

  useEffect(() => {
    const init = async () => {
      const wallet = await getAccounts();
      await checkNewUser(wallet?.address);
    };
    newUser && init();
  }, [newUser]);

  const loadWallet = async () => {
    if (!provider || !loggedIn) {
      return;
    } else {
      const init = async () => {
        if (!provider) {
          await initWeb3Auth();
        }
        let wallet = await getAccounts();
        const extendedWallet = {
          ...wallet,
          extensionName: "web3auth",
        };

        selectWallet(extendedWallet);
      };
      init();
    }
  };

  const checkNewUser = async (userAddress) => {
    try {
      const response = await fetch("/api/checkNewUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userAddress }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Transfer successful!");
        // Handle success (e.g., show a success message or update UI)
      } else {
        console.error("Error:", data.error);
        // Handle error (e.g., show an error message or alert)
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle error (e.g., show an error message or alert)
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
          web3AuthNetwork: "cyan",
          uiConfig: {
            loginMethodsOrder: [
              "google",
              "facebook",
              "twitter",
              "discord",
              "twitch",
              "email_passwordless",
            ],
            appName: "WSX",
            mode: "dark",
            logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
            logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
            defaultLanguage: "en",
            loginGridCol: 3,
            primaryButton: "externalLogin", // "externalLogin" | "socialLogin" | "emailLogin"
          },
        });
        setWeb3auth(web3authInstance);
        setProvider(web3authInstance.provider);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const signup = async () => {
    if (!web3auth) {
      return;
    }
    await initWeb3Auth();
    await web3auth.initModal();
    if (web3auth.status === "connected") {
      await disconnectWallet();
      await web3auth.logout();
    }
    const web3authProvider = await web3auth.connect();

    setProvider(web3authProvider);
    setLoggedIn(true);
    setNewUser(true);
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
    if (web3auth.status === "connected") {
      await web3auth.logout();
    }
    await disconnectWallet();
    setProvider(null);
    setLoggedIn(false);
    setNewUser(false);
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
    signup,
    logout,
    onGetPolkadotKeypair,
    authenticateUser,
    getAccounts,
  };
};
