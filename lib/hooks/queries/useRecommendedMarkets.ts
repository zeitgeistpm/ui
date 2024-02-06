import { useQuery } from "@tanstack/react-query";
import {
  FullMarketFragment,
  MarketOrderByInput,
  MarketStatus,
  ZeitgeistIndexer,
} from "@zeitgeistpm/indexer";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { getOutcomesForMarkets } from "lib/gql/markets-list/outcomes-for-markets";
import { getCurrentPrediction } from "lib/util/assets";
import { useSdkv2 } from "../useSdkv2";
import { QueryMarketData } from "./useInfiniteMarkets";
import { useMarket } from "./useMarket";
import { searchMarketsText } from "./useMarketSearch";

export const recommendedMarketsRootKey = "recommended-markets";

export const useRecommendedMarkets = (marketId?: number, limit = 2) => {
  const [sdk, id] = useSdkv2();
  const { data: market } = useMarket(marketId ? { marketId } : undefined);

  const enabled = sdk && market && isIndexedSdk(sdk);

  const query = useQuery(
    [id, recommendedMarketsRootKey, market?.marketId],
    async () => {
      if (enabled) {
        const similarMarkets = await searchMarketsText(
          sdk.indexer,
          market.question ?? "",
        );

        if (market.question && similarMarkets.length > 0) {
          return {
            markets: await mapMarkets(
              sdk.indexer,
              similarMarkets
                .filter((m) => m.question !== market.question)
                .slice(0, 2),
            ),
            type: "similar" as const,
          };
        } else {
          const { markets: popularMarkets } = await sdk.indexer.markets({
            limit,
            order: [MarketOrderByInput.VolumeDesc],
            where: {
              status_eq: MarketStatus.Active,
              marketId_not_eq: marketId,
              volume_gt: "0",
            },
          });
          return {
            markets: await mapMarkets(sdk.indexer, popularMarkets),
            type: "popular" as const,
          };
        }
      }
    },
    {
      enabled: Boolean(enabled),
      staleTime: Infinity,
    },
  );

  return query;
};

const mapMarkets = async (
  indexer: ZeitgeistIndexer,
  markets: FullMarketFragment[],
) => {
  const outcomes = await getOutcomesForMarkets(indexer.client, markets);

  let resMarkets: Array<QueryMarketData> = [];

  for (const market of markets) {
    const marketOutcomes = outcomes[market.marketId];
    const prediction =
      market && market.assets.length > 0
        ? getCurrentPrediction(market.assets, market)
        : { name: "None", price: 0 };

    resMarkets = [
      ...resMarkets,
      { ...market, outcomes: marketOutcomes, prediction },
    ];
  }

  return resMarkets;
};
