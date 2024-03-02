import { useQuery } from "@tanstack/react-query";
import {
  MarketOrderByInput,
  MarketStatus,
  ScoringRule,
} from "@zeitgeistpm/indexer";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { useMarket } from "./useMarket";
import { searchMarketsText } from "./useMarketSearch";
import { WHITELISTED_TRUSTED_CREATORS } from "lib/constants/whitelisted-trusted-creators";

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
            markets: similarMarkets
              .filter((m) => m.question !== market.question)
              .slice(0, 2),
            type: "similar" as const,
          };
        } else {
          const { markets: popularMarkets } = await sdk.indexer.markets({
            limit,
            order: [MarketOrderByInput.VolumeDesc],
            where: {
              AND: [
                {
                  status_eq: MarketStatus.Active,
                  marketId_not_eq: marketId,
                  volume_gt: "0",
                  scoringRule_not_eq: ScoringRule.Parimutuel,
                },
                {
                  disputeMechanism_isNull: false,
                  OR: [
                    {
                      creator_in: WHITELISTED_TRUSTED_CREATORS,
                    },
                  ],
                },
              ],
            },
          });
          return {
            markets: popularMarkets,
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
