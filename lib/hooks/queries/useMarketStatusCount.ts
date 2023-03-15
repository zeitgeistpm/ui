import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { MarketStatus } from "@zeitgeistpm/indexer";

export const rootKey = "market-status-count";

export const useMarketStatusCount = (status: MarketStatus) => {
  const [sdk, id] = useSdkv2();

  const isIndexed = sdk && isIndexedSdk(sdk);

  const query = useQuery([id, isIndexed, rootKey, status], async () => {
    if (isIndexed) {
      return (await sdk.indexer.marketStatusCount({ status })).markets.length;
    }
    return 0;
  });

  return query;
};
