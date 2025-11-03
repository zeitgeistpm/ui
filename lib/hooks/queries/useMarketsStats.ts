import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { graphQlEndpoint } from "lib/constants";
import { useSdkv2 } from "../useSdkv2";

export const marketsStatsRootQuery = "markets-stats";

// Create a singleton GraphQL client
let directClient: GraphQLClient | null = null;
const getDirectClient = () => {
  if (!directClient) {
    directClient = new GraphQLClient(graphQlEndpoint);
  }
  return directClient;
};

export const useMarketsStats = (
  marketIds: number[],
): UseQueryResult<MarketStats[]> => {
  const [sdk, id] = useSdkv2();

  return useQuery<MarketStats[]>(
    [marketsStatsRootQuery, marketIds],
    async () => {
      if (marketIds.length === 0) {
        return [];
      }

      // Always use direct client for consistency
      const client = getDirectClient();

      try {
        const poolStats = await getMarketsStats(client, marketIds);
        return poolStats || [];
      } catch (error) {
        // Return empty array to prevent UI breakage
        return [];
      }
    },
    {
      // Enable if we have marketIds
      enabled: marketIds.length > 0,
      keepPreviousData: true,
      staleTime: 100_000,
      retry: 1,
      retryDelay: 500,
    },
  );
};