import { useQuery } from "@tanstack/react-query";
import {
  Context,
  isAvailable,
  isIndexedData,
  isNA,
  isRpcData,
  isRpcSdk,
  Market,
  NA,
  na,
} from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "authority-proxies-for-market";

export const useAuthorityProxiesForMarket = (market: Market<Context>) => {
  const [sdk, id] = useSdkv2();

  const authority =
    isRpcData(market) && market.disputeMechanism.isAuthorized
      ? market.disputeMechanism.asAuthorized.toString()
      : isIndexedData(market) && Boolean(market.disputeMechanism.Authorized)
      ? market.disputeMechanism.Authorized
      : na("Authority not avaialable for market");

  const query = useQuery<string[] | NA>(
    [id, rootKey, authority],
    async () => {
      if (isNA(authority)) return authority;
      if (isRpcSdk(sdk)) {
        const [proxies] = await sdk.context.api.query.proxy.proxies(authority);
        return proxies.map((item) => item.delegate.toString());
      }
    },
    {
      initialData: na("Authority not available for market"),
      enabled: Boolean(authority && isAvailable(authority)),
    },
  );

  return query;
};
