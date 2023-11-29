import { useQuery } from "@tanstack/react-query";
import * as batshit from "@yornaath/batshit";
import { CmsMarketMetadata } from "lib/cms/get-market-metadata";

export const useMarketCmsMetadata = (marketId: string | number) => {
  return useQuery<CmsMarketMetadata | null>(
    ["cms", "market-metadata", Number(marketId)],
    async () => {
      return batcher.fetch(Number(marketId));
    },
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
