import {
  IOMarketOutcomeAssetId,
  MarketOutcomeAssetId,
  getIndexOf,
  getMarketIdOf,
  isIndexedSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import { MarketStatus } from "@zeitgeistpm/indexer";
import { useSdkv2 } from "../useSdkv2";
import { useAccountTokenPositions } from "./useAccountTokenPositions";
import { useQuery } from "@tanstack/react-query";

export const redeemableMarketsRootKey = "redeemable-markets";

export const useRedeemableMarkets = (account?: string) => {
  const [sdk, id] = useSdkv2();
  const { data: tokenPositions } = useAccountTokenPositions(account);

  const enabled = sdk && account && tokenPositions && isIndexedSdk(sdk);

  return useQuery(
    [
      id,
      redeemableMarketsRootKey,
      account,
      tokenPositions
        ?.map((p) => p.id)
        .sort()
        .join("|"),
    ],
    async () => {
      if (enabled) {
        if (!tokenPositions.length) return [];

        const outcomeAssetIds = tokenPositions
          .map((tokenPosition) =>
            parseAssetId(tokenPosition.assetId).unwrapOr(null),
          )
          .filter((assetId): assetId is MarketOutcomeAssetId =>
            IOMarketOutcomeAssetId.is(assetId),
          );

        const marketIds = outcomeAssetIds.map((assetId) =>
          getMarketIdOf(assetId),
        );

        const marketsResponse = await sdk.indexer.markets({
          where: {
            marketId_in: marketIds,
            status_eq: MarketStatus.Resolved,
          },
        });

        const redeemableMarkets = marketsResponse.markets.filter((market) => {
          if (market.marketType.scalar) return true;

          const hasWinningPosition =
            tokenPositions.filter((tokenPosition) => {
              const assetId = parseAssetId(tokenPosition.assetId).unwrapOr(
                null,
              );
              if (assetId && IOMarketOutcomeAssetId.is(assetId)) {
                return (
                  market.marketId === getMarketIdOf(assetId) &&
                  getIndexOf(assetId) === market.report?.outcome.categorical
                );
              }
            }).length > 0;

          return hasWinningPosition;
        });

        return redeemableMarkets;
      }
    },
    {
      enabled: Boolean(enabled),
    },
  );
};
