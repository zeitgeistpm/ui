import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { TimeFilter } from "components/ui/TimeFilters";
import { gql } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const marketPriceHistoryKey = "market-price-histroy";

const priceHistoyQuery = gql`
  query PriceHistory($marketId: Float!, $interval: String) {
    priceHistory(marketId: $marketId, interval: $interval) {
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
  timeFilter: TimeFilter,
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketPriceHistoryKey],
    async () => {
      console.log("a");

      if (isIndexedSdk(sdk)) {
        console.log("b");

        const a = await sdk.indexer.client.request<{
          priceHistory: PricePoint[];
        }>(priceHistoyQuery, {
          marketId: marketId,
          interval: timeFilter.interval,
        });
        console.log(a);

        // return a!.priceHistory!;
      }
    },
    {
      enabled: Boolean(sdk && marketId != null && timeFilter),
    },
  );

  return query;
};
