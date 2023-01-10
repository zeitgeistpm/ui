import { useQuery } from "@tanstack/react-query";
import { IndexerContext, isIndexedSdk, Sdk } from "@zeitgeistpm/sdk-next";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { memoize } from "lodash-es";
import * as batshit from "@yornaath/batshit";
import { useSdkv2 } from "../useSdkv2";

export const marketsRootQuery = "markets";

export const useMarket = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketsRootQuery, marketId],
    async () => {
      if (isIndexedSdk(sdk)) {
        return batcher(sdk).fetch(marketId);
      }
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk)),
    },
  );

  return query;
};

const batcher = memoize((sdk: Sdk<IndexerContext>) => {
  return batshit.create<FullMarketFragment, number>({
    name: marketsRootQuery,
    fetcher: async (ids) => {
      const { markets } = await sdk.context.indexer.markets({
        where: {
          marketId_in: ids,
        },
      });
      return markets;
    },
    scheduler: batshit.windowScheduler(10),
    resolver: batshit.keyResolver("marketId"),
  });
});
