import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { getMultiMarketAssets, AssetWithNullMarket } from "lib/gql/combo-pools";
import { useSdkv2 } from "../useSdkv2";
import { GraphQLClient } from "graphql-request";

export const multiMarketAssetsRootQuery = "multi-market-assets";

export const useMultiMarketAssets = (
  multiMarketAssets: string[],
): UseQueryResult<AssetWithNullMarket[]> => {

  const [sdk] = useSdkv2();

  const isEnabled = Boolean(sdk && isIndexedSdk(sdk) && multiMarketAssets.length > 0);

  return useQuery({
    queryKey: [multiMarketAssetsRootQuery, ...multiMarketAssets],
    queryFn: async () => {
      if (!sdk) {
        return [];
      }

      if (!isIndexedSdk(sdk)) {
        return [];
      }

      if (multiMarketAssets.length === 0) {
        return [];
      }

      try {
        const assets = await getMultiMarketAssets(
          sdk.indexer.client as unknown as GraphQLClient,
          multiMarketAssets
        );
        return assets || [];
      } catch (error) {
        return [];
      }
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};