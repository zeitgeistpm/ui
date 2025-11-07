import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { getNeoPoolParentCollectionIds } from "lib/gql/combo-pools";

export const neoPoolParentCollectionIdsKey = "neo-pool-parent-collection-ids";

export const useNeoPoolParentCollectionIds = (poolId: number | null) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, neoPoolParentCollectionIdsKey, poolId],
    async () => {
      if (!isIndexedSdk(sdk) || poolId == null) {
        return null;
      }
      const result = await getNeoPoolParentCollectionIds(
        sdk.indexer.client as any,
        poolId
      );
      return result;
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk) && poolId != null),
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  return query;
};