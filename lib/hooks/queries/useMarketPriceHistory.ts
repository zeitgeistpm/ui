import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { TimeUnit } from "components/ui/TimeFilters";
import { gql, GraphQLClient } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const marketPriceHistoryKey = "market-price-history";

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
