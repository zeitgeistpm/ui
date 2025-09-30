import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk, isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { getPoolsAssetIds } from "lib/gql/combo-pools";

const poolsAssetIdsRootQuery = "pools-asset-ids";

export const usePoolsAssetIds = (
  poolIds: number[],
): UseQueryResult<Map<number, any[]>> => {
  const [sdk] = useSdkv2();

  return useQuery({
    queryKey: [poolsAssetIdsRootQuery, ...poolIds],
    queryFn: async () => {
      if (isIndexedSdk(sdk)) {
        return getPoolsAssetIds(sdk.indexer.client, poolIds);
      }
      return new Map();
    },
    enabled: Boolean(sdk && isIndexedSdk(sdk) && poolIds.length > 0),
  });
};