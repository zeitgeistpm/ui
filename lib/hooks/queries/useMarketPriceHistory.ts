import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { gql, GraphQLClient } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const marketPriceHistoryKey = "market-price-histroy";

const priceHistoyQuery = gql`
  query PriceHistory($marketId: Float!, $interval: String, $startTime: String) {
    priceHistory(
      marketId: $marketId
      interval: $interval
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
  interval: string,
  startTime: string, //ISO timestamp
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketPriceHistoryKey, marketId, interval, startTime],
    async () => {
      if (isIndexedSdk(sdk)) {
        return await getPriceHistory(
          sdk.indexer.client,
          marketId,
          interval,
          startTime,
        );
      }
    },
    {
      enabled: Boolean(sdk && marketId != null && interval && startTime),
    },
  );

  return query;
};

export async function getPriceHistory(
  client: GraphQLClient,
  marketId: number,
  interval: string,
  startTime: string,
) {
  const { priceHistory } = await client.request<{
    priceHistory: PriceHistory[];
  }>(priceHistoyQuery, {
    marketId: marketId,
    interval: interval,
    startTime: startTime,
  });

  return priceHistory;
}
