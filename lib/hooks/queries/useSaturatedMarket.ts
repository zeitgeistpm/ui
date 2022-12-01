import { useQuery } from "@tanstack/react-query";
import { Context, isRpcData, Market } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "market:saturated";

export const useSaturatedMarket = (market?: Market<Context>) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, market?.marketId],
    async () => {
      return isRpcData(market) ? await market.saturate() : market;
    },
    {
      enabled: Boolean(sdk && market),
    },
  );

  return query;
};
