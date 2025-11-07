import { useQuery } from "@tanstack/react-query";
import { MarketOrderByInput, ZeitgeistIndexer, MarketStatus } from "@zeitgeistpm/indexer";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import Fuse from "fuse.js";
import { isWSX, wsxID } from "lib/constants";
import { useDebounce } from "use-debounce";
import { useSdkv2 } from "../useSdkv2";

export const marketSearchKey = "market-search";
export const activeMarketsKey = "active-markets";

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

// New hook for loading active markets without search requirement
export const useActiveMarkets = () => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, activeMarketsKey],
    async () => {
      if (isIndexedSdk(sdk)) {
        return loadActiveMarkets(sdk.indexer);
      }
      return [];
    },
    {
      enabled: isIndexedSdk(sdk),
      staleTime: 30_000, // Cache for 30 seconds
    },
  );

  return query;
};

// Combined hook that shows active markets initially, then searches when typing
export const useMarketSearchWithDefaults = (searchTerm: string) => {
  const [sdk, id] = useSdkv2();
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  
  // Trim the search term and check if it has meaningful content
  const trimmedSearchTerm = debouncedSearchTerm?.trim() || "";
  const hasSearchTerm = trimmedSearchTerm.length > 1;
  
  // Use a single query that handles both cases to prevent switching between queries
  const query = useQuery(
    [id, activeMarketsKey, hasSearchTerm ? "search" : "default", trimmedSearchTerm],
    async () => {
      if (!isIndexedSdk(sdk)) return [];
      
      if (hasSearchTerm) {
        // Search mode
        return searchMarketsText(sdk.indexer, trimmedSearchTerm);
      } else {
        // Default mode - load active markets
        return loadActiveMarkets(sdk.indexer);
      }
    },
    {
      enabled: isIndexedSdk(sdk),
      staleTime: hasSearchTerm ? 10_000 : 30_000, // Different cache times
      keepPreviousData: true, // This prevents flickering when switching modes
    },
  );

  return {
    data: query.data,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
  };
};

export const loadActiveMarkets = async (indexer: ZeitgeistIndexer) => {
  const { markets } = await indexer.markets({
    where: {
      AND: [
        {
          baseAsset_eq: isWSX ? `{"foreignAsset":${wsxID}}` : undefined,
          baseAsset_not_eq: !isWSX ? `{"foreignAsset":${wsxID}}` : undefined,
        },
        {
          status_eq: MarketStatus.Active,
        },
      ],
    },
    order: MarketOrderByInput.IdDesc,
    limit: 100,
  });

  return markets;
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
          baseAsset_eq: isWSX ? `{"foreignAsset":${wsxID}}` : undefined,
          baseAsset_not_eq: !isWSX ? `{"foreignAsset":${wsxID}}` : undefined,
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
