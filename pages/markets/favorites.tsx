import { QueryClient, dehydrate } from "@tanstack/query-core";
import FavoriteMarketsList from "components/markets/FavoriteMarketsList";
import { getCmsMarketMetadataForAllMarkets } from "lib/cms/markets";
import { environment } from "lib/constants";
import { marketCmsDatakeyForMarket } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { NextPage } from "next";

const FavoriteMarketsPage: NextPage = () => {
  return <FavoriteMarketsList />;
};

export async function getStaticProps() {
  const queryClient = new QueryClient();
  const cmsData = await getCmsMarketMetadataForAllMarkets();

  for (const marketCmsData of cmsData) {
    if (marketCmsData.marketId) {
      queryClient.setQueryData(
        marketCmsDatakeyForMarket(marketCmsData.marketId),
        marketCmsData,
      );
    }
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate:
      environment === "production"
        ? 3 * 60 //3 min
        : 60 * 60,
  };
}

export default FavoriteMarketsPage;
