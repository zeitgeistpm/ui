import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { IndexerContext, Market, isIndexedSdk } from "@zeitgeistpm/sdk";
import { CmsMarketMetadata } from "lib/cms/markets";
import { useFavoriteMarketsStorage } from "lib/state/favorites";
import { MarketOutcomes } from "lib/types/markets";
import { useSdkv2 } from "../useSdkv2";
import { marketCmsDatakeyForMarket } from "./cms/useMarketCmsMetadata";

export const rootKey = "markets-favorites";

export type QueryMarketData = Market<IndexerContext> & {
  outcomes: MarketOutcomes;
  prediction: { name: string; price: number };
};

export const useFavoriteMarkets = () => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();
  const storage = useFavoriteMarketsStorage();

  const fetcher = async (): Promise<FullMarketFragment[] | null> => {
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

    return markets;
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
