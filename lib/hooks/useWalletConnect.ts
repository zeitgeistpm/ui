import { UniversalProvider } from "@walletconnect/universal-provider";
import { WalletConnectModal } from "@walletconnect/modal";
import { useWallet } from "lib/state/wallet";
import { useAtom } from "jotai";
import { providerAtom, topicAtom } from "lib/state/util/web3auth-config";

const useWalletConnectInit = () => {
  const [, setProvider] = useAtom(providerAtom);
  const [, setTopic] = useAtom(topicAtom);
  const { selectWallet } = useWallet();

  const initWC = async () => {
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
    if (!walletConnectSession.topic) return;
    setTopic(walletConnectSession.topic);

    const walletConnectAccounts = Object.values(walletConnectSession.namespaces)
      .map((namespace) => namespace.accounts)
      .flat();

    const accounts = walletConnectAccounts.map((wcAccount) => {
      const address = wcAccount.split(":")[2];
      return address;
    });

    await walletConnectModal.closeModal();

    if (accounts.length > 0) {
      selectWallet("walletconnect", accounts);
    }
  };

  return { initWC };
};

export default useWalletConnectInit;
