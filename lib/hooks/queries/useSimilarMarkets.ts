import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk, isRpcSdk } from "@zeitgeistpm/sdk";
import { MarketStatus, MarketOrderByInput } from "@zeitgeistpm/indexer";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";
import { useMarket } from "./useMarket";
import { getOutcomesForMarkets } from "lib/gql/markets-list/outcomes-for-markets";
import { QueryMarketData } from "./useInfiniteMarkets";
import { getCurrentPrediction } from "lib/util/assets";

export const similarMarketsRootKey = "similar-markets";

export const useSimilarMarkets = (marketId?: number, limit = 2) => {
  const [sdk, id] = useSdkv2();
  const { data: market } = useMarket(marketId ? { marketId } : undefined);

  const enabled = sdk && market && isIndexedSdk(sdk);

  const query = useQuery(
    [id, similarMarketsRootKey, market?.marketId],
    async () => {
      if (enabled) {
        const response = await sdk.indexer.markets({
          limit,
          order: [MarketOrderByInput.PoolVolumeDesc],
          where: {
            tags_containsAny: market?.tags,
            status_eq: MarketStatus.Active,
            marketId_not_eq: marketId,
            pool: {
              volume_gt: "0",
            },
          },
        });

        const markets = response.markets;

        const outcomes = await getOutcomesForMarkets(
          sdk.indexer.client,
          markets,
        );

        let resMarkets: Array<QueryMarketData> = [];

        for (const m of markets) {
          const marketOutcomes = outcomes[m.marketId];
          const prediction =
            m.pool != null
              ? getCurrentPrediction(marketOutcomes, m as any)
              : { name: "None", price: 0 };

          resMarkets = [
            ...resMarkets,
            { ...m, outcomes: marketOutcomes, prediction },
          ];
        }

        return resMarkets;
      }
    },
    {
      enabled: Boolean(enabled),
    },
  );

  return query;
};
