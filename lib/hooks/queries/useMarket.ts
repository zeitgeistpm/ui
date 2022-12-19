import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const marketsRootQuery = "markets";

export const useMarket = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketsRootQuery, marketId],
    async () => {
      if (isIndexedSdk(sdk)) {
        const market = await sdk.model.markets.get({ marketId });
        return market.unwrap();
      }
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk)),
    },
  );

  return query;
};
