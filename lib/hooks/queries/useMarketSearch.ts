import { useQuery } from "@tanstack/react-query";
import { MarketOrderByInput, ZeitgeistIndexer } from "@zeitgeistpm/indexer";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import Fuse from "fuse.js";
import { useDebounce } from "use-debounce";
import { useSdkv2 } from "../useSdkv2";
import { isNTT, nttID } from "lib/constants";

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
        return searchMarketsText(sdk.indexer, debouncedSearchTerm);
      }
    },
    {
      enabled: Boolean(enabled),
      staleTime: 10_000,
    },
  );

  return query;
};

export const searchMarketsText = async (
  indexer: ZeitgeistIndexer,
  query: string,
) => {
  const search = buildSearch(query);
  const { markets } = await indexer.markets({
    where: {
      AND: [
        {
          baseAsset_eq: isNTT ? `{"foreignAsset":${nttID}}` : undefined,
          baseAsset_not_eq: !isNTT ? `{"foreignAsset":${nttID}}` : undefined,
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
    $or: [{ question: query }, { description: query }, { status: "Active" }],
  });

  return result.map((r) => r.item);
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
