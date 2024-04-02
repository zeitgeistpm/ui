import { QueryClient, dehydrate } from "@tanstack/query-core";
import MarketsList from "components/markets/MarketsList";
import { getCmsMarketCardMetadataForAllMarkets } from "lib/cms/markets";
import { environment } from "lib/constants";
import { HeroBannerWSX } from "components/front-page/HeroBannerWSX";
import { marketCmsDatakeyForMarket } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { NextPage } from "next";

const MarketsPage: NextPage = ({
  cmsTopicPlaceholders,
}: {
  cmsTopicPlaceholders: string[];
}) => {
  return (
    <>
      <HeroBannerWSX />
      <MarketsList />
    </>
  );
};

export async function getStaticProps() {
  const queryClient = new QueryClient();

  const [cmsMarketMetaData] = await Promise.all([
    getCmsMarketCardMetadataForAllMarkets(),
  ]);

  for (const marketCmsData of cmsMarketMetaData) {
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
