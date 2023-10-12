import { useQuery } from "@tanstack/react-query";
import { IndexerContext, isIndexedSdk, Sdk } from "@zeitgeistpm/sdk";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { memoize } from "lodash-es";
import * as batshit from "@yornaath/batshit";
import { useSdkv2 } from "../useSdkv2";
import { marketMetaFilter } from "./constants";

export const marketsRootQuery = "markets";

export type UseMarketFilter = { marketId: number } | { poolId: number };

export const useMarket = (
  filter?: UseMarketFilter,
  opts?: { refetchInterval: number | false },
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketsRootQuery, filter],
    async () => {
      if (
        isIndexedSdk(sdk) &&
        filter &&
        (("marketId" in filter && filter.marketId != null) ||
          ("poolId" in filter && filter.poolId != null))
      ) {
        return batcher(sdk).fetch(filter);
      }
      return null;
    },
    {
      refetchInterval: opts?.refetchInterval ?? false,
      staleTime: 10_000,
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
  return batshit.create<FullMarketFragment | undefined, UseMarketFilter>({
    name: marketsRootQuery,
    fetcher: async (ids) => {
      const { markets } = await sdk.indexer.markets({
        where: {
          AND: [
            marketMetaFilter,
            {
              OR: [
                {
                  marketId_in: ids
                    .filter(
                      (id): id is { marketId: number } => "marketId" in id,
                    )
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
          ],
        },
      });
      return markets;
    },

    scheduler: batshit.windowScheduler(10),
    resolver: (data, query) => {
      if ("marketId" in query) {
        return data.find((m) => m?.marketId === query.marketId);
      }
      if ("poolId" in query) {
        return data.find((m) => m?.pool?.poolId === query.poolId);
      }
    },
  });
});
