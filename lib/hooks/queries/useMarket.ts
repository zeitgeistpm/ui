import { useQuery } from "@tanstack/react-query";
import { IndexerContext, isIndexedSdk, Sdk } from "@zeitgeistpm/sdk-next";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { memoize } from "lodash-es";
import * as batshit from "@yornaath/batshit";
import { useSdkv2 } from "../useSdkv2";

export const marketsRootQuery = "markets";

export type UseMarketFilter = { marketId: number } | { poolId: number };

export const useMarket = (filter?: UseMarketFilter) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketsRootQuery, filter],
    async () => {
      if (
        isIndexedSdk(sdk) &&
        (("marketId" in filter && filter.marketId != null) ||
          ("poolId" in filter && filter.poolId != null))
      ) {
        return batcher(sdk).fetch(filter);
      }
      return null;
    },
    {
      enabled: Boolean(
        sdk &&
          isIndexedSdk(sdk) &&
          filter &&
          ("marketId" in filter || "poolId" in filter),
      ),
    },
  );

  return query;
};

const batcher = memoize((sdk: Sdk<IndexerContext>) => {
  return batshit.create<FullMarketFragment, UseMarketFilter>({
    name: marketsRootQuery,
    fetcher: async (ids) => {
      const { markets } = await sdk.indexer.markets({
        where: {
          OR: [
            {
              marketId_in: ids
                .filter((id): id is { marketId: number } => "marketId" in id)
                .map((id) => id.marketId),
            },
            {
              pool: {
                poolId_in: ids
                  .filter((id): id is { poolId: number } => "poolId" in id)
                  .map((id) => id.poolId),
              },
            },
          ],
        },
      });
      return markets;
    },
    scheduler: batshit.windowScheduler(10),
    resolver: (data, query) => {
      if ("marketId" in query) {
        return data.find((m) => m.marketId === query.marketId);
      }
      if ("poolId" in query) {
        return data.find((m) => m.pool?.poolId === query.poolId);
      }
    },
  });
});
