import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import Fuse from "fuse.js";
import { useDebounce } from "use-debounce";
import { useSdkv2 } from "../useSdkv2";
import { MarketOrderByInput } from "@zeitgeistpm/indexer";
import { isWSX, wsxID } from "lib/constants";

export const marketSearchKey = "market-search";

export const useMarketSearch = (searchTerm: string) => {
  const [sdk, id] = useSdkv2();

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const enabled =
    isIndexedSdk(sdk) && debouncedSearchTerm && debouncedSearchTerm.length > 1;

  const query = useQuery(
    [id, marketSearchKey, debouncedSearchTerm],
    async () => {
      if (enabled) {
        const search = buildSearch(debouncedSearchTerm);
        const { markets } = await sdk.indexer.markets({
          where: {
            AND: [
              {
                baseAsset_eq: isWSX ? `{"foreignAsset":${wsxID}}` : undefined,
                baseAsset_not_eq: !isWSX
                  ? `{"foreignAsset":${wsxID}}`
                  : undefined,
              },
              {
                OR: search,
              },
            ],
          },
          order: MarketOrderByInput.IdDesc,
          limit: 100,
        });
        const fuse = new Fuse(markets, {
          includeScore: true,
          threshold: 0.9,
          keys: [
            //matches in the question are consisdered more important than description, slightly favour active markets
            {
              name: "question",
              weight: 3,
            },
            {
              name: "description",
              weight: 1,
            },
            { name: "status", weight: 0.2 },
          ],
        });

        const result = fuse.search({
          $or: [
            { question: debouncedSearchTerm },
            { description: debouncedSearchTerm },
            { status: "Active" },
          ],
        });

        return result.map((r) => r.item);
      }
    },
    {
      enabled: Boolean(enabled),
      staleTime: 10_000,
    },
  );

  return query;
};

const buildSearch = (searchTerm: string) => {
  const search = searchTerm
    .trim()
    .split(" ")
    .map((word) => [
      { question_containsInsensitive: word },
      { description_containsInsensitive: word },
    ])
    .flat();

  return search;
};
