import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IndexerContext, Market, isIndexedSdk } from "@zeitgeistpm/sdk";
import { MarketOutcomes } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";
import { useSdkv2 } from "../useSdkv2";
import { CmsMarketMetadata } from "lib/cms/markets";
import { marketCmsDatakeyForMarket } from "./cms/useMarketCmsMetadata";
import { useFavoriteMarketsStorage } from "lib/state/favorites";

export const rootKey = "markets-favorites";

export type QueryMarketData = Market<IndexerContext> & {
  outcomes: MarketOutcomes;
  prediction: { name: string; price: number };
};

export const useFavoriteMarkets = () => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();
  const storage = useFavoriteMarketsStorage();

  const fetcher = async (): Promise<QueryMarketData[] | null> => {
    if (!isIndexedSdk(sdk)) {
      return null;
    }

    const markets: Market<IndexerContext>[] = await sdk.model.markets.list({
      where: {
        marketId_in: storage.favorites.map((favorite) => favorite.marketId),
      },
    });

    for (const market of markets) {
      const cmsData: CmsMarketMetadata | undefined = queryClient.getQueryData(
        marketCmsDatakeyForMarket(market.marketId),
      );
      if (cmsData?.question) market.question = cmsData.question;
      if (cmsData?.imageUrl) market.img = cmsData.imageUrl;
    }

    const resMarkets: Array<QueryMarketData> = markets.map((market) => {
      const outcomes: MarketOutcomes = market.assets.map((asset, index) => {
        return {
          price: asset.price,
          name: market.categories?.[index].name ?? "",
          assetId: asset.assetId,
          amountInPool: asset.amountInPool,
        };
      });

      const prediction = getCurrentPrediction(outcomes, market);

      return {
        ...market,
        outcomes,
        prediction,
      };
    });

    return resMarkets;
  };

  const query = useQuery({
    queryKey: [
      id,
      rootKey,
      ...storage.favorites.map((favorite) => favorite.marketId),
    ],
    queryFn: fetcher,
    keepPreviousData: true,
    enabled: isIndexedSdk(sdk) && Boolean(sdk),
  });

  return query;
};
