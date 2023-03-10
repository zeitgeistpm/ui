import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { TimeFilter } from "components/ui/TimeFilters";
import { gql } from "graphql-request";
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

interface PricePoint {
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
        const { priceHistory } = await sdk.indexer.client.request<{
          priceHistory: PricePoint[];
        }>(priceHistoyQuery, {
          marketId: marketId,
          interval: interval,
          startTime: startTime,
        });

        return priceHistory;
      }
    },
    {
      enabled: Boolean(sdk && marketId != null && interval && startTime),
    },
  );

  return query;
};
