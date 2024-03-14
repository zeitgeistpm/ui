import { useState, useCallback } from "react";
import { UniversalProvider } from "@walletconnect/universal-provider";
import { WalletConnectModal } from "@walletconnect/modal";
import { useWallet } from "lib/state/wallet";
import IUniversalProvider from "@walletconnect/universal-provider";
import { useAtom } from "jotai";
import { providerAtom, sessionAtom } from "lib/state/util/web3auth-config";

const useWalletConnectInit = () => {
  const [, setProvider] = useAtom(providerAtom);
  const [, setSession] = useAtom(sessionAtom);
  const [accounts, setAccounts] = useState([]);
  const { selectWallet, disconnectWallet, walletId } = useWallet();

  const initWC = useCallback(async () => {
    const wcProvider = await UniversalProvider.init({
      projectId: "bc3373ccb16b53e7d5eb57672db4b4f8",
      relayUrl: "wss://relay.walletconnect.com",
    });
    setProvider(wcProvider);

    const params = {
      requiredNamespaces: {
        polkadot: {
          methods: ["polkadot_signTransaction", "polkadot_signMessage"],
          chains: ["polkadot:1bf2a2ecb4a868de66ea8610f2ce7c8c"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    };

    const { uri, approval } = await wcProvider.client.connect(params);
    const walletConnectModal = new WalletConnectModal({
      projectId: "bc3373ccb16b53e7d5eb57672db4b4f8",
    });

    if (uri) {
      walletConnectModal.openModal({ uri });
    }

    const walletConnectSession = await approval();
    setSession(walletConnectSession);

    const walletConnectAccounts = Object.values(walletConnectSession.namespaces)
      .map((namespace) => namespace.accounts)
      .flat();

    const extractedAccounts = walletConnectAccounts.map((wcAccount) => {
      const address = wcAccount.split(":")[2];
      return address;
    });

    setAccounts(extractedAccounts);
    await walletConnectModal.closeModal();
    selectWallet("walletconnect", extractedAccounts); // Handle as needed
  }, []);

  return { initWC, accounts };
};

export default useWalletConnectInit;
