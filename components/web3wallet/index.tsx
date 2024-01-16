import { useEffect, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { set } from "lodash-es";

export const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_ZTG!;

const Web3wallet = () => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(false);
  const [isProviderReady, setIsProviderReady] = useState(false);

  useEffect(() => {
    const init = async () => {
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

        const web3auth = new Web3AuthNoModal({
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
              auth0emailpasswordless: {
                verifier: "auth-0-all",
                verifierSubIdentifier: "auth0-passwordless",
                typeOfLogin: "jwt",
                clientId: "4v1l8rc65YNzcbY93wxJzgCUqKNxoSMm",
              },
            },
          },
        });
        web3auth.configureAdapter(openloginAdapter);
        setWeb3auth(web3auth);

        await web3auth.init();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
          setIsProviderReady(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (isProviderReady) {
      getKeypair();
    }
  }, [isProviderReady]);

  const loginGoogle = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    console.log(web3auth);
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
    }
  };

  const loginEmail = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    console.log(web3auth);
    const web3authProvider = await web3auth.connectTo(
      WALLET_ADAPTERS.OPENLOGIN,
      {
        loginProvider: "auth0emailpasswordless",
        extraLoginOptions: {
          domain: "https://dev-yacn6ah0b1dc12yh.us.auth0.com",
          verifierIdField: "email",
          isVerifierIdCaseSensitive: false,
          login_hint: "hello@web3auth.io",
        },
      },
    );
    if (web3authProvider) {
      setProvider(web3authProvider);
    }
  };

  const getKeypair = async () => {
    console.log(provider);
    if (!provider) return;
    await cryptoWaitReady();
    const privateKey = await provider.request({
      method: "private_key",
    });
    const keyring = new Keyring({ ss58Format: 73, type: "sr25519" });
    const keyPair = keyring.addFromUri("0x" + privateKey);
    console.log(keyPair.address);
    return keyPair;
  };

  const logout = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    setIsProviderReady(false);
  };

  console.log(provider);
  return (
    <>
      <button onClick={loginGoogle}>Login with Web3 Google</button>
      <button onClick={loginEmail}>Login with Web3 Email</button>
      <button onClick={logout}>Logout</button>
    </>
  );
};

export default Web3wallet;
