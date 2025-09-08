import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { TimeUnit } from "components/ui/TimeFilters";
import { gql, GraphQLClient } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const marketPriceHistoryKey = "market-price-history";
export const poolPriceHistoryKey = "pool-price-history";

const priceHistoryQuery = gql`
  query PriceHistory(
    $marketId: Int!
    $unit: Unit!
    $value: Int!
    $startTime: String
  ) {
    priceHistory(
      marketId: $marketId
      interval: { unit: $unit, value: $value }
      startTime: $startTime
    ) {
      prices {
        assetId
        price
      }
      timestamp
    }
  }
`;

const priceHistoryByPoolIdQuery = gql`
  query PriceHistoryByPoolId(
    $poolId: Int!
    $unit: Unit!
    $value: Int!
    $startTime: String
  ) {
    priceHistoryByPoolId(
      poolId: $poolId
      interval: { unit: $unit, value: $value }
      startTime: $startTime
    ) {
      prices {
        assetId
        price
      }
      timestamp
    }
  }
`;

export interface PriceHistory {
  timestamp: string;
  prices: { assetId: string; price: number }[];
}
export const useMarketPriceHistory = (
  marketId: number,
  timeUnit: TimeUnit,
  timeValue: number,
  startTime: string, //ISO timestamp
) => {
  const [sdk, id] = useSdkv2();
  console.log(marketId, timeUnit, timeValue, startTime);

  const query = useQuery(
    [id, marketPriceHistoryKey, marketId, timeUnit, timeValue, startTime],
    async () => {
      if (isIndexedSdk(sdk)) {
        return await getPriceHistory(
          sdk.indexer.client as any,
          marketId,
          timeUnit,
          timeValue,
          startTime,
        );
      }
    },
    {
      enabled: Boolean(
        sdk && marketId != null && timeUnit && timeValue && startTime,
      ),
      staleTime: 10_000,
    },
  );

  return query;
};

export const useComboMarketPriceHistory = (
  poolId: number,
  timeUnit: TimeUnit,
  timeValue: number,
  startTime: string, //ISO timestamp
) => {
  const [sdk, id] = useSdkv2();
  
  const query = useQuery({
    queryKey: [id, poolPriceHistoryKey, poolId, timeUnit, timeValue, startTime],
    queryFn: async () => {
      if (!isIndexedSdk(sdk)) {
        return [];
      }
      
      const data = await getPriceHistoryByPoolId(
        sdk.indexer.client as any,
        poolId,
        timeUnit,
        timeValue,
        startTime,
      );
      return data;
    },
    enabled: Boolean(
      sdk && poolId != null && timeUnit && timeValue && startTime,
    ),
    staleTime: 10_000,
    retry: 1,
  });
  
  return query;
};

export async function getPriceHistory(
  client: GraphQLClient,
  marketId: number,
  timeUnit: TimeUnit,
  timeValue: number,
  startTime: string,
) {
  const { priceHistory } = await client.request<{
    priceHistory: PriceHistory[];
  }>(priceHistoryQuery, {
    marketId: marketId,
    unit: timeUnit,
    value: timeValue,
    startTime: startTime,
  });

  return priceHistory;
}

export async function getPriceHistoryByPoolId(
  client: GraphQLClient,
  poolId: number,
  timeUnit: TimeUnit,
  timeValue: number,
  startTime: string,
) {
  const { priceHistoryByPoolId } = await client.request<{
    priceHistoryByPoolId: PriceHistory[];
  }>(priceHistoryByPoolIdQuery, {
    poolId: poolId,
    unit: timeUnit,
    value: timeValue,
    startTime: startTime,
  });
  return priceHistoryByPoolId;
}
