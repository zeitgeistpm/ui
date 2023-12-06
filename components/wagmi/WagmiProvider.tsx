import { useSquid } from "lib/hooks/squid-router/useSquid";
import { formatChainsForWagmi } from "lib/squid/formatChainsForWagmi";
import { useMemo } from "react";
import { WagmiConfig, configureChains, createClient } from "wagmi";
import { mainnet } from "wagmi/chains";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

export const WagmiProvider = ({ children }) => {
  const squid = useSquid();

  const client = useMemo(() => {
    const { chains, provider, webSocketProvider } = configureChains(
      squid.connected ? formatChainsForWagmi(squid.sdk.chains) : [mainnet],
      [alchemyProvider({ apiKey: "yourAlchemyApiKey" }), publicProvider()],
    );

    const wagmiConfig = createClient({
      autoConnect: true,
      connectors: [
        new MetaMaskConnector({ chains }),
        new CoinbaseWalletConnector({
          chains,
          options: {
            appName: "wagmi",
          },
        }),
      ],
      provider,
      webSocketProvider,
    });

    return wagmiConfig;
  }, [squid.connected]);

  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};

export default WagmiProvider;
