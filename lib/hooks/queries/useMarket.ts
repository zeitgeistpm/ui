import { useQuery } from "@tanstack/react-query";
import { IndexerContext, isIndexedSdk, Sdk } from "@zeitgeistpm/sdk-next";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import * as batshit from "@yornaath/batshit";
import { useSdkv2 } from "../useSdkv2";

export const marketsRootQuery = "markets";

const marketsBatcher = batshit.create<
  FullMarketFragment,
  { marketId: number; sdk: Sdk<IndexerContext> }
>({
  name: marketsRootQuery,
  fetcher: async (queries) => {
    const sdk = queries[0].sdk;
    const { markets } = await sdk.context.indexer.markets({
      where: {
        marketId_in: queries.map((q) => q.marketId),
      },
    });
    return markets;
  },
  scheduler: batshit.windowScheduler(10),
  resolver: (markets, query) => {
    return markets.find((m) => m.marketId === query.marketId);
  },
});

export const useMarket = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketsRootQuery, marketId],
    async () => {
      if (isIndexedSdk(sdk)) {
        return marketsBatcher.fetch({ marketId, sdk });
      }
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk)),
    },
  );

  return query;
};
