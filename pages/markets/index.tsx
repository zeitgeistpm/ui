import { NextPage } from "next";
import MarketsList from "components/markets/MarketsList";
import { QueryClient, dehydrate } from "@tanstack/query-core";
import { getCmsMarketMetadataForAllMarkets } from "lib/cms/get-market-metadata";
import { marketCmsDatakeyForMarket } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { environment } from "lib/constants";

const MarketsPage: NextPage = () => {
  return <MarketsList />;
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

export default MarketsPage;
