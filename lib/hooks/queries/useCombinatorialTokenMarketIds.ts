import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "get-combinatorial-market-ids";

export const useCombinatorialTokenMarketIds = (combinatorialTokens: string[]) => {
  const [sdk, id] = useSdkv2();
  
  return useQuery({
    queryKey: [rootKey, id ?? "default", combinatorialTokens],
    queryFn: async () => {
      if (!sdk || !isIndexedSdk(sdk) || !combinatorialTokens.length) {
        return [];
      }

      // Fetch market IDs for all combinatorial tokens in parallel
      const promises = combinatorialTokens.map(async (token) => {
        // Note: GraphQL expects lowercase 'combinatorialToken'
        const assetIdString = JSON.stringify({ combinatorialToken: token });

        try {
          const res = await sdk.indexer.assets({
            where: {
              assetId_eq: assetIdString,
            },
          });
          return res.assets?.[0]?.market?.marketId ?? null;
        } catch (error) {
          console.error(`Error fetching market ID for token ${token}:`, error);
          return null;
        }
      });

      const marketIds = await Promise.all(promises);
      
      // Return a map of token -> marketId for easy lookup
      const tokenToMarketIdMap: Record<string, number | null> = {};
      combinatorialTokens.forEach((token, index) => {
        tokenToMarketIdMap[token] = marketIds[index];
      });
      
      return tokenToMarketIdMap;
    },
    enabled: Boolean(sdk && isIndexedSdk(sdk) && combinatorialTokens.length > 0),
  });
};
