import { useQuery } from "@tanstack/react-query";
import { getMarketsStats, MarketStats } from "lib/gql/markets-stats";
import { useStore } from "lib/stores/Store";

export const useMarketsStats = (marketIds: number[] = []) => {
  const { graphQLClient } = useStore();

  return useQuery<MarketStats[]>(
    ["marketsStats", marketIds],
    () => getMarketsStats(graphQLClient, marketIds),
    {
      enabled: !!graphQLClient || !!marketIds.length,
    },
  );
};
