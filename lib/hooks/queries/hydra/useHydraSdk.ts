import { PoolService, TradeRouter } from "@galacticcouncil/sdk";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { useQuery } from "@tanstack/react-query";

export const hydraSdkRootKey = "hydra-sdk";

export const useHydraSdk = () => {
  const query = useQuery(
    [hydraSdkRootKey],
    async () => {
      const wsProvider = new WsProvider("wss://rpc.hydradx.cloud");
      const api = await ApiPromise.create({ provider: wsProvider });

      // Initialize Trade Router
      const poolService = new PoolService(api);
      const tradeRouter = new TradeRouter(poolService);
      // const pools = await poolService.getPools()

      return { poolService, tradeRouter };
    },
    {
      staleTime: Infinity,
    },
  );

  return query;
};
