import { ChainData, ChainType } from "@0xsquid/squid-types";
import type { Chain } from "wagmi";

export const formatChainsForWagmi = (chains: ChainData[]): Chain[] => {
  return chains
    .filter((c) => c.chainType === ChainType.EVM)
    .map(formatChainForWagmi);
};

export const formatChainForWagmi = (chain: ChainData): Chain => {
  return {
    id: +chain.chainId,
    name: chain.networkName,
    network: chain.networkName,
    contracts: {
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      },
    },
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: { public: { http: [chain.rpc] }, default: { http: [chain.rpc] } },
  };
};
