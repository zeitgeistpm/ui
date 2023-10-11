import { useQuery } from "@tanstack/react-query";
import {
  Context,
  hasPool,
  isIndexedData,
  Market,
  MetadataStorage,
} from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "market-enabled";

export const useMarketIsTradingEnabled = (
  market?: Market<Context<MetadataStorage>>,
) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && !!market;
  const { data: isEnabled } = useQuery(
    [id, rootKey, market?.marketId],
    async () => {
      if (!enabled) return;
      const status = isIndexedData(market)
        ? market.status
        : market?.status.toString();
      return (
        status?.toLowerCase() === "active" &&
        (await hasPool<Context>(sdk, market))
      );
    },
    {
      enabled: Boolean(sdk && market),
      initialData: false,
    },
  );

  return isEnabled;
};
