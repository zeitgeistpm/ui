import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { TimeFilter } from "components/ui/TimeFilters";
import { gql } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const marketPriceHistoryKey = "market-price-histroy";

const accountBondsQuery = gql`
  query PriceHistory($marketId: Int, $interval: String) {
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
export const useMarketSpotPrices = (
  marketId: number,
  timeFilter: TimeFilter,
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketPriceHistoryKey],
    async () => {
      if (isIndexedSdk(sdk)) {
        const { priceHistory } = await sdk.indexer.client.request<{
          priceHistory: PricePoint[];
        }>(accountBondsQuery, {
          marketId: marketId,
          interval: timeFilter.interval,
        });
        return priceHistory;
      }
    },
    {
      enabled: Boolean(sdk && marketId != null && timeFilter),
    },
  );

  return query;
};
