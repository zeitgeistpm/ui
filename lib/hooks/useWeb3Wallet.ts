import { use, useEffect, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { useWallet } from "lib/state/wallet";
import { web3authAtom, web3ProviderAtom } from "lib/state/util/web3auth-config";
import { useAtom } from "jotai";

export const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_ZTG!;
const useWeb3Wallet = () => {
  const [web3auth] = useAtom(web3authAtom);
  const [provider, setProvider] = useAtom(web3ProviderAtom);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(false);
  const { selectWallet, disconnectWallet, walletId } = useWallet();

  const initWeb3Auth = async () => {
    try {
      if (!clientId) {
        return;
      }

      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.OTHER,
        chainId: "0x1",
        rpcTarget: "https://rpc.polkadot.io/",
        displayName: "Polkadot Mainnet",
        blockExplorer: "https://explorer.polkascan.io/",
        ticker: "DOT",
        tickerName: "Polkadot",
      };

      const web3authNoModal = new Web3AuthNoModal({
        clientId,
        chainConfig,
        web3AuthNetwork: "sapphire_devnet",
      });

      const privateKeyProvider = new CommonPrivateKeyProvider({
        config: { chainConfig },
      });

      const openloginAdapter = new OpenloginAdapter({
        privateKeyProvider,
        adapterSettings: {
          clientId,
          loginConfig: {
            auth0google: {
              verifier: "auth-0-all",
              verifierSubIdentifier: "auth0-google",
              typeOfLogin: "jwt",
              clientId: "4v1l8rc65YNzcbY93wxJzgCUqKNxoSMm",
            },
            // auth0fb: {
            //   verifier: "auth-0-all",
            //   verifierSubIdentifier: "auth0-fb",
            //   typeOfLogin: "jwt",
            //   clientId: "4v1l8rc65YNzcbY93wxJzgCUqKNxoSMm",
            // },
            auth0emailpasswordless: {
              verifier: "auth-0-all",
              verifierSubIdentifier: "auth0-passwordless",
              typeOfLogin: "jwt",
              clientId: "4v1l8rc65YNzcbY93wxJzgCUqKNxoSMm",
            },
          },
        },
      });
      if (web3auth) {
        web3auth.configureAdapter(openloginAdapter);
        await web3auth.init();
        setProvider(web3auth.provider);
      }
      console.log(web3auth);
    } catch (error) {
      console.error(error);
    }
  };

  //get account on initial login
  useEffect(() => {
    console.log(loggedIn, walletId, provider, web3auth);
    if (loggedIn || walletId === "web3auth") {
      const init = async () => {
        const keyPair = await getKeypair();
        console.log(keyPair);
        if (keyPair) {
          console.log(keyPair);
          selectWallet("web3auth", keyPair);
        }
      };
      init();
    }
  }, [loggedIn, walletId, provider]);

  const loginGoogle = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    if (web3auth.connected) {
      await web3auth.logout();
    }
    await web3auth.init();
    try {
      const web3authProvider = await web3auth.connectTo(
        WALLET_ADAPTERS.OPENLOGIN,
        {
          loginProvider: "auth0google",
          extraLoginOptions: {
            domain: "https://dev-yacn6ah0b1dc12yh.us.auth0.com",
            verifierIdField: "email",
            isVerifierIdCaseSensitive: false,
            connection: "google-oauth2",
          },
        },
      );
      if (web3authProvider) {
        setProvider(web3authProvider);
        setLoggedIn(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const loginEmail = async (email?: string) => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    if (web3auth.connected) {
      await web3auth.logout();
    }
    await web3auth.init();
    try {
      const web3authProvider = await web3auth.connectTo(
        WALLET_ADAPTERS.OPENLOGIN,
        {
          loginProvider: "auth0emailpasswordless",
          extraLoginOptions: {
            domain: "https://dev-yacn6ah0b1dc12yh.us.auth0.com",
            verifierIdField: "email",
            isVerifierIdCaseSensitive: false,
            login_hint: email,
          },
        },
      );
      if (web3authProvider) {
        setProvider(web3authProvider);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getKeypair = async () => {
    if (!provider) {
      return;
    }
    await cryptoWaitReady();
    const privateKey = await provider.request({
      method: "private_key",
    });
    const keyring = new Keyring({ ss58Format: 73, type: "sr25519" });
    const keyPair = keyring.addFromUri("0x" + privateKey);
    return keyPair;
  };

  const logoutWeb3Auth = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    disconnectWallet();
  };
  return { loginEmail, loginGoogle, logoutWeb3Auth, getKeypair, initWeb3Auth };
};

export default useWeb3Wallet;
