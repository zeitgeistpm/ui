import { useQuery } from "@tanstack/react-query";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "market";

export const useMarket = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, marketId],
    async () => {
      const market = await sdk.model.markets.get({ marketId });
      return market.unwrap();
    },
    {
      enabled: Boolean(sdk),
    },
  );

  return query;
};
