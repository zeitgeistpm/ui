import { UniversalProvider } from "@walletconnect/universal-provider";
import { WalletConnectModal } from "@walletconnect/modal";
import { useWallet } from "lib/state/wallet";
import { useAtom } from "jotai";
import { providerAtom, topicAtom } from "lib/state/util/web3auth-config";
import { hexToU8a, isHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/keyring";
export interface WalletConnectAccounts {
  address: Uint8Array[];
}

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

    // const extractedAccounts =
    //   walletConnectAccounts.reduce<WalletConnectAccounts>(
    //     (acc, wcAccount) => {
    //       const address = wcAccount.split(":")[2].toString();
    //       const formattedAddress = isHex(address)
    //         ? hexToU8a(address)
    //         : decodeAddress(address);
    //       if (acc.address.length < 1) {
    //         acc.address = [formattedAddress];
    //       } else {
    //         acc.address = [...acc.address, formattedAddress];
    //       }
    //       return acc;
    //     },
    //     { address: [] },
    //   );

    await walletConnectModal.closeModal();
    console.log(walletConnectAccounts);
    if (walletConnectAccounts.length > 0) {
      selectWallet("walletconnect", { address: walletConnectAccounts });
    }
  };

  return { initWC };
};

export default useWalletConnectInit;
