import { useQuery } from "@tanstack/react-query";
import { useHydraSdk } from "./useHydraSdk";
import { WsProvider } from "@polkadot/api";
import { BigNumber } from "@galacticcouncil/sdk";

export const hydraSellRootKey = "hydra-sell";

export const useHydraSell = (assetIn: any, amountIn: any) => {
  const { data } = useHydraSdk();
  const { poolService, tradeRouter } = data ?? {};

  const enabled = !!assetIn && !!amountIn && !!tradeRouter;
  const query = useQuery(
    [hydraSellRootKey, assetIn, amountIn],
    async () => {
      const a = await tradeRouter
        ?.getBestSell("0", "10", "100000000")
        .catch((e) => {
          console.log(e);
        });

      console.log(a);

      console.log(a?.toTx(BigNumber(100)));
    },
    {
      staleTime: 10_000,
      enabled,
    },
  );

  return query;
};
