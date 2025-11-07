import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { marketsRootQuery, UseMarketFilter } from "./useMarket";
import { marketMetaFilter } from "./constants";

export const rootKey = "markets-by-id";

export const useMarketsByIds = (marketQueries?: UseMarketFilter[]) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const query = useQuery(
    [id, rootKey, marketQueries],
    async () => {
      if (marketQueries && isIndexedSdk(sdk)) {
        return sdk.model.markets.list({
          where: {
            AND: [
              marketMetaFilter,
              {
                OR: [
                  {
                    pool: {
                      poolId_in: marketQueries
                        .filter(
                          (filter): filter is { poolId: number } =>
                            "poolId" in filter,
                        )
                        .map((filter) => filter.poolId),
                    },
                  },
                  {
                    marketId_in: marketQueries
                      .filter(
                        (filter): filter is { marketId: number } =>
                          "marketId" in filter,
                      )
                      .map((filter) => filter.marketId),
                  },
                ],
              },
            ],
          },
        });
      }
      return [];
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && marketQueries && isIndexedSdk(sdk)),
      staleTime: 30000, // Data fresh for 30 seconds
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      onSuccess(data) {
        data?.forEach((market) => {
          queryClient.setQueryData(
            [id, marketsRootQuery, { marketId: market.marketId }],
            market,
          );
          queryClient.setQueryData(
            [id, marketsRootQuery, { poolId: market.pool?.poolId }],
            market,
          );
        });
      },
    },
  );

  return query;
};
