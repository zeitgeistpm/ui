import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rpcMarketRootKey = "rpc-market";

export const useRpcMarket = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rpcMarketRootKey, marketId],
    async () => {
      if (isRpcSdk(sdk)) {
        const market = await sdk.asRpc().model.markets.get(marketId);
        return market.unwrap();
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && marketId != null),
    },
  );

  return query;
};
