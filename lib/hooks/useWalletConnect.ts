import { useEffect, useState } from "react";
import { WalletConnect } from "lib/state/wallet-connect";
import { useWallet } from "lib/state/wallet";

export const useWalletConnect = () => {
  const [walletConnect, setWalletConnect] = useState<WalletConnect>();
  const [error, setError] = useState<Error>();
  const { selectWallet } = useWallet();

  useEffect(() => {
    try {
      const walletConnectInstance = new WalletConnect({
        onModalOpen: () => console.log("Modal opened"),
        onModalClose: () => console.log("Modal closed"),
      });

      setWalletConnect(walletConnectInstance);

      return () => {
        walletConnectInstance.close();
      };
    } catch (err) {
      console.error("Failed to initialize WalletConnect:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to initialize WalletConnect"),
      );
    }
  }, []);
  // console.log(walletConnect, "walletConnect");
  // selectWallet("polkadot-js");
  return { walletConnect, error };
};

// import { UniversalProvider } from "@walletconnect/universal-provider";
// import { WalletConnectModal } from "@walletconnect/modal";
// import { useWallet } from "lib/state/wallet";
// import { useAtom } from "jotai";
// import { providerAtom, topicAtom } from "lib/state/util/web3auth-config";
// import { WalletConnectSigner } from "lib/util/wallet-connect-signer";
// import { useState } from "react";
// import { ZTG_CHAIN_ID } from "lib/constants";

// const useWalletConnectInit = () => {
//   const [, setProvider] = useAtom(providerAtom);
//   const [, setTopic] = useAtom(topicAtom);
//   const [signer, setSigner] = useState<WalletConnectSigner | null>(null);
//   const { selectWallet } = useWallet();

//   const initWC = async () => {
//     try {
//       const wcProvider = await UniversalProvider.init({
//         projectId: "bc3373ccb16b53e7d5eb57672db4b4f8",
//         relayUrl: "wss://relay.walletconnect.com",
//       });
//       setProvider(wcProvider);

//       const params = {
//         requiredNamespaces: {
//           polkadot: {
//             methods: ["polkadot_signTransaction", "polkadot_signMessage"],
//             chains: [ZTG_CHAIN_ID],
//             events: ["disconnect", "accountsChanged"],
//           },
//         },
//       };

//       const { uri, approval } = await wcProvider.client.connect(params);
//       const walletConnectModal = new WalletConnectModal({
//         projectId: "bc3373ccb16b53e7d5eb57672db4b4f8",
//         enableExplorer: false,
//         explorerRecommendedWalletIds: "NONE",
//       });

//       if (uri) {
//         walletConnectModal.openModal({ uri });
//       }

//       const walletConnectSession = await approval();
//       console.log(walletConnectSession, "walletConnectSession");
//       if (!walletConnectSession.topic) return;
//       setTopic(walletConnectSession.topic);

//       const wcSigner = new WalletConnectSigner(
//         wcProvider.client,
//         walletConnectSession,
//         ZTG_CHAIN_ID,
//       );
//       setSigner(wcSigner);

//       const walletConnectAccounts = Object.values(
//         walletConnectSession.namespaces,
//       )
//         .map((namespace) => namespace.accounts)
//         .flat();

//       const accounts = walletConnectAccounts.map((wcAccount) => {
//         const address = wcAccount.split(":")[2];
//         return address;
//       });
//       console.log(accounts, "accounts");
//       await walletConnectModal.closeModal();

//       if (accounts.length > 0) {
//         selectWallet("walletconnect", accounts);
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return { initWC, signer };
// };

// export default useWalletConnectInit;
