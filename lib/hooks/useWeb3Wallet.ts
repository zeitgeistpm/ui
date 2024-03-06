import { WALLET_ADAPTERS, IProvider } from "@web3auth/base";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { useWallet } from "lib/state/wallet";
import {
  web3authAtom,
  web3WalletConnectAtom,
  chainConfig,
} from "lib/state/util/web3auth-config";
import { useAtom } from "jotai";
import { openloginAdapter, clientId } from "lib/state/util/web3auth-config";
import { useNotifications } from "lib/state/notifications";
import { useEffect, useState } from "react";
import UniversalProvider from "@walletconnect/universal-provider";
import { WalletConnectModal } from "@walletconnect/modal";

interface loginOptions {
  loginProvider: string;
  extraLoginOptions: {
    domain: string;
    verifierIdField: "email" | "sub";
    isVerifierIdCaseSensitive?: boolean;
    login_hint?: string;
    connection: string;
  };
}

const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;

const useWeb3Wallet = () => {
  const [web3auth] = useAtom(web3authAtom);
  const [web3WalletConnect] = useAtom(web3WalletConnectAtom);
  const notificationStore = useNotifications();
  const { selectWallet, disconnectWallet, walletId } = useWallet();
  const [isReady, setIsReady] = useState(false);

  const initWeb3Auth = async () => {
    if (!clientId) {
      return;
    }
    try {
      if (web3auth) {
        web3auth.configureAdapter(openloginAdapter);
        await web3auth.init();
        if (walletId === "web3auth" && web3auth.provider) {
          await getKeypair(web3auth.provider);
        }
      }
    } catch (error) {
      return;
    }
  };

  const initWC = async () => {
    const wcProvider = await UniversalProvider.init({
      projectId: "bc3373ccb16b53e7d5eb57672db4b4f8",
      relayUrl: "wss://relay.walletconnect.com",
    });

    const params = {
      requiredNamespaces: {
        polkadot: {
          methods: ["polkadot_signTransaction", "polkadot_signMessage"],
          chains: ["polkadot:1bf2a2ecb4a868de66ea8610f2ce7c8c"],
          events: ['chainChanged", "accountsChanged'],
        },
      },
    };
    const { uri, approval } = await wcProvider.client.connect(params);
    console.log(uri, approval);
    const walletConnectModal = new WalletConnectModal({
      projectId: "bc3373ccb16b53e7d5eb57672db4b4f8",
    });

    // if there is a URI from the client connect step open the modal
    if (uri) {
      walletConnectModal.openModal({ uri });
    }
    // await session approval from the wallet app
    const walletConnectSession = await approval();

    const walletConnectAccount = Object.values(walletConnectSession.namespaces)
      .map((namespace) => namespace.accounts)
      .flat();

    console.log(walletConnectAccount);

    // grab account addresses from CAIP account formatted accounts
    // const accounts = wcAccounts.map(wcAccount => {
    //   const address = wcAccount.split(':')[2]
    //   return address
    // })
  };

  const login = async (loginOptions: loginOptions) => {
    if (!web3auth || !auth0Domain) {
      notificationStore.pushNotification(
        `Error connecting: please try another login method or check back later.`,
        {
          type: "Error",
          autoRemove: true,
          lifetime: 5,
        },
      );
      return;
    }
    if (web3auth.connected) {
      await web3auth.logout();
    }
    await web3auth.init();
    try {
      const web3authProvider = await web3auth.connectTo(
        WALLET_ADAPTERS.OPENLOGIN,
        loginOptions,
      );
      if (web3authProvider) {
        await getKeypair(web3authProvider);
        // TODO: refactor user onboarding
        // const user = await web3auth.getUserInfo();
        // try {
        //   const res = await fetch("/api/onboardUser", {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({ email: user.email, name: user.name }),
        //   });
        // } catch (e) {
        //   return;
        // }
      }
    } catch (e) {
      notificationStore.pushNotification(
        `Error connecting: please try again later.`,
        {
          type: "Error",
          autoRemove: true,
          lifetime: 5,
        },
      );
    }
  };

  const loginGoogle = () => {
    if (!auth0Domain) {
      return;
    }
    login({
      loginProvider: "auth0google",
      extraLoginOptions: {
        domain: auth0Domain,
        verifierIdField: "email",
        isVerifierIdCaseSensitive: false,
        connection: "google-oauth2",
      },
    });
  };

  const loginTwitter = () => {
    if (!auth0Domain) {
      return;
    }
    login({
      loginProvider: "auth0twitter",
      extraLoginOptions: {
        domain: auth0Domain,
        verifierIdField: "sub",
        connection: "twitter",
      },
    });
  };

  const loginDiscord = () => {
    if (!auth0Domain) {
      return;
    }
    login({
      loginProvider: "discord",
      extraLoginOptions: {
        domain: "",
        verifierIdField: "email",
        isVerifierIdCaseSensitive: false,
        connection: "discord",
      },
    });
  };

  const loginEmail = (email?: string) => {
    if (!auth0Domain) {
      return;
    }
    login({
      loginProvider: "auth0emailpasswordless",
      extraLoginOptions: {
        domain: auth0Domain,
        verifierIdField: "email",
        isVerifierIdCaseSensitive: false,
        login_hint: email,
        connection: "email",
      },
    });
  };

  const getKeypair = async (provider: IProvider) => {
    if (!provider) {
      return;
    }
    await cryptoWaitReady();
    const privateKey = await provider.request({
      method: "private_key",
    });
    const keyring = new Keyring({ ss58Format: 73, type: "sr25519" });
    const keyPair = keyring.addFromUri("0x" + privateKey);
    if (keyPair) {
      selectWallet("web3auth", keyPair);
    }
  };

  const logoutWeb3Auth = async () => {
    if (!web3auth) {
      return;
    }
    await web3auth.logout();
    disconnectWallet();
  };

  return {
    loginEmail,
    loginGoogle,
    loginTwitter,
    loginDiscord,
    logoutWeb3Auth,
    initWeb3Auth,
    initWC,
  };
};

export default useWeb3Wallet;
