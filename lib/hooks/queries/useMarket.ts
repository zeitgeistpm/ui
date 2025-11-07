import { useQuery } from "@tanstack/react-query";
import {
  IndexerContext,
  IOCategoricalAssetId,
  isIndexedSdk,
  MarketOutcomeAssetId,
  Sdk,
} from "@zeitgeistpm/sdk";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { memoize } from "lodash-es";
import * as batshit from "@yornaath/batshit";
import { useSdkv2 } from "../useSdkv2";
import { marketMetaFilter } from "./constants";
import { isCombinatorialToken, CombinatorialToken, getCombinatorialHash,  } from "lib/types/combinatorial";

export const marketsRootQuery = "markets";

export type UseMarketFilter = { marketId: number } | { poolId: number };

export const useMarket = (
  filter?: UseMarketFilter,
  opts?: { refetchInterval: number | false },
) => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, marketsRootQuery, filter],
    async () => {
      if (
        isIndexedSdk(sdk) &&
        filter &&
        (("marketId" in filter && filter.marketId != null) ||
          ("poolId" in filter && filter.poolId != null))
      ) {
        const result = await batcher(sdk).fetch(filter);
        // Return null instead of undefined when no market is found
        // TanStack Query v5 requires query functions to never return undefined
        return result ?? null;
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
};

const batcher = memoize((sdk: Sdk<IndexerContext>) => {
  return batshit.create({
    name: marketsRootQuery,
    fetcher: async (ids: UseMarketFilter[]) => {
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

export const lookupAssetMetadata = (
  market: FullMarketFragment,
  assetId: MarketOutcomeAssetId | CombinatorialToken,
) => {
  if(isCombinatorialToken(assetId)) {
    const index = market.outcomeAssets.findIndex((asset) => asset.includes(assetId.CombinatorialToken));
    return market.categories?.[index];
  }else if (IOCategoricalAssetId.is(assetId)) {
    return market.categories?.[assetId.CategoricalOutcome[1]];
  } else {
    const scalarIndex = assetId.ScalarOutcome[1] === "Long" ? 0 : 1;
    return market.categories?.[scalarIndex];
  }
};
