import { useQuery } from "@tanstack/react-query";
import { MarketWhereInput, MarketOrderByInput } from "@zeitgeistpm/indexer";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "markets-pools";

/**
 * Hook that parses query parameters in url to correct gql filter/order.
 */
declare const useMarketsListQueryParams: () => {
  where: MarketWhereInput;
  order: MarketOrderByInput;
};

export const useMarketsList = () => {
  const [sdk, id] = useSdkv2();

  const marketsQuery = useMarketsListQueryParams();

  /**
   * Fetching will be cached and reactive by the current url query params.
   */
  const query = useQuery(
    [id, rootKey, marketsQuery],
    async () => {
      return sdk.asIndexer().model.markets.list(marketsQuery);
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk)),
    },
  );

  return query;
};
