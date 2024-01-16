import { useEffect, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";

export const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_ZTG!;

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

const web3wallet = () => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(false);

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
            uxMode: "redirect",
            loginConfig: {
              google: {
                verifier: "auth-0-all",
                verifierSubIdentifier: "auth0-google",
                typeOfLogin: "google",
                clientId: "4v1l8rc65YNzcbY93wxJzgCUqKNxoSMm",
              },
              auth0emailpasswordless: {
                verifier: "auth-0-all",
                verifierSubIdentifier: "auth0-google",
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
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const loginGoogle = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connectTo(
      WALLET_ADAPTERS.OPENLOGIN,
      {
        loginProvider: "google",
      },
    );
    setProvider(web3authProvider);
  };

  // const getKeypair = async (provider: IProvider) => {
  //   await cryptoWaitReady();
  //   const privateKey = await provider.request({
  //     method: "private_key",
  //   });
  //   const keyring = new Keyring({ ss58Format: 73, type: "sr25519" });
  //   const keyPair = keyring.addFromUri("0x" + privateKey);
  //   return keyPair;
  // };
};

export default web3wallet;
