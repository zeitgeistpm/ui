import { useQuery } from "@tanstack/react-query";
import { Context, isRpcSdk, Market } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const marketDisputesRootKey = "market-disputes";

export const useMarketDisputes = (market: Market<Context> | number) => {
  const [sdk, id] = useSdkv2();

  const marketId = typeof market === "number" ? market : market.marketId;

  const query = useQuery(
    [id, marketDisputesRootKey, marketId],
    async () => {
      if (isRpcSdk(sdk)) {
        return await sdk.api.query.predictionMarkets.disputes(marketId);
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk)),
    },
  );

  return query;
};
