import { useQuery } from "@tanstack/react-query";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { getComboPools, ComboPoolData } from "lib/gql/combo-pools";

const rootKey = "all-combo-pools";

/**
 * Hook to fetch all combo pools for duplicate detection
 * Returns all combo pools with their marketIds
 */
export const useAllComboPools = () => {
  const [sdk, id] = useSdkv2();

  const fetcher = async (): Promise<ComboPoolData[]> => {
    if (!isIndexedSdk(sdk)) {
      return [];
    }

    // Fetch a large number of pools to get all combos
    // Adjust limit if you expect more than 1000 combo pools
    const allPools = await getComboPools(sdk.indexer.client as any, 1000, 0);
    return allPools;
  };

  const query = useQuery({
    queryKey: [id, rootKey],
    queryFn: fetcher,
    enabled: isIndexedSdk(sdk) && Boolean(sdk),
    staleTime: 30_000, // Cache for 30 seconds
  });

  return query;
};

/**
 * Helper function to check if a combo with the same market IDs exists (in ANY order)
 * This is necessary because combos with the same markets in different order
 * share the exact same combinatorial tokens and thus the same trades.
 *
 * @param marketIds - Array of market IDs to check
 * @param existingPools - Array of existing combo pools
 * @returns The duplicate pool if found, undefined otherwise
 */
export const findDuplicateCombo = (
  marketIds: number[],
  existingPools: ComboPoolData[],
): ComboPoolData | undefined => {
  return existingPools.find((pool) => {
    // Check if arrays have same length
    if (pool.marketIds.length !== marketIds.length) {
      return false;
    }

    // Check if both arrays contain the same market IDs (regardless of order)
    // Convert to sets and compare
    const poolIdSet = new Set(pool.marketIds);
    return marketIds.every((id) => poolIdSet.has(id));
  });
};
