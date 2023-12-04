import { ChainData, ChainType } from "@0xsquid/squid-types";
import type { Chain } from "wagmi";

export const formatChainsForWagmi = (chains: ChainData[]): Chain[] => {
  return chains
    .filter((c) => c.chainType === ChainType.EVM)
    .map((c) => ({
      id: +c.chainId,
      name: c.networkName,
      network: c.networkName,
      contracts: {
        multicall3: {
          address: "0xcA11bde05977b3631167028862bE2a173976CA11",
        },
      },
      nativeCurrency: c.nativeCurrency,
      rpcUrls: { public: { http: [c.rpc] }, default: { http: [c.rpc] } },
    }));
};
