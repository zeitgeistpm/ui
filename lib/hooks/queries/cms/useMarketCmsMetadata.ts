import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as batshit from "@yornaath/batshit";
import { CmsMarketMetadata } from "lib/cms/markets";

export const marketCmsDataRootKey = ["cms", "market-metadata"];

export const marketCmsDatakeyForMarket = (marketId: string | number) => [
  ...marketCmsDataRootKey,
  Number(marketId),
];

export const useMarketCmsMetadata = (marketId: string | number) => {
  return useQuery<CmsMarketMetadata | null>(
    marketCmsDatakeyForMarket(marketId),
    async () => {
      return batcher.fetch(Number(marketId));
    },
    { staleTime: 100_000 },
  );
};

const batcher = batshit.create({
  fetcher: async (marketIds: number[]) => {
    const res = await fetch(
      `/api/cms/market-metadata/batch?marketIds=${JSON.stringify(marketIds)}`,
    );
    return (await res.json()) as CmsMarketMetadata[];
  },
  scheduler: batshit.windowScheduler(10),
  resolver: (items, query) =>
    items.find((meta) => Number(meta.marketId) === Number(query)) ?? null,
});
