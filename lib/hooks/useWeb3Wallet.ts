import { WALLET_ADAPTERS, IProvider } from "@web3auth/base";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { useWallet } from "lib/state/wallet";
import { web3authAtom } from "lib/state/util/web3auth-config";
import { useAtom } from "jotai";
import { openloginAdapter, clientId } from "lib/state/util/web3auth-config";

const auth0Domain = "https://dev-yacn6ah0b1dc12yh.us.auth0.com";

const useWeb3Wallet = () => {
  const [web3auth] = useAtom(web3authAtom);
  const { selectWallet, disconnectWallet, walletId } = useWallet();

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
      console.error(error);
    }
  };

  const login = async (loginOptions) => {
    if (!web3auth) {
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
      console.log(web3authProvider);
      if (web3authProvider) {
        await getKeypair(web3authProvider);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loginGoogle = () => {
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

  const loginEmail = (email?: string) => {
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

  return { loginEmail, loginGoogle, logoutWeb3Auth, initWeb3Auth };
};

export default useWeb3Wallet;
