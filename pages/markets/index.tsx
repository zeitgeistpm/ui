import { NextPage } from "next";
import MarketsList from "components/markets/MarketsList";
import { QueryClient, dehydrate } from "@tanstack/query-core";
import { getCmsMarketMetadataForAllMarkets } from "lib/cms/markets";
import { marketCmsDatakeyForMarket } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { environment } from "lib/constants";
import { HeroBannerWSX } from "components/front-page/HeroBannerWSX";
import { CmsTopicHeader, getCmsTopicHeaders } from "lib/cms/topics";
import { getPlaiceholders } from "lib/util/getPlaiceHolders";

const MarketsPage: NextPage = ({
  cmsTopics,
  cmsTopicPlaceholders,
}: {
  cmsTopics: CmsTopicHeader[];
  cmsTopicPlaceholders: string[];
}) => {
  return (
    <>
      <HeroBannerWSX />
      <MarketsList
        cmsTopics={cmsTopics}
        cmsTopicPlaceholders={cmsTopicPlaceholders}
      />
    </>
  );
};

export async function getStaticProps() {
  const queryClient = new QueryClient();

  const [cmsMarketMetaData, cmsTopics] = await Promise.all([
    getCmsMarketMetadataForAllMarkets(),
    getCmsTopicHeaders(),
  ]);

  const cmsTopicPlaceholders = await getPlaiceholders(
    cmsTopics.map((topic) => topic.thumbnail ?? ""),
    { size: 16 },
  ).then((plh) => plh.map((c) => c.base64) ?? []);

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
      cmsTopics,
      cmsTopicPlaceholders,
    },
    revalidate:
      environment === "production"
        ? 3 * 60 //3 min
        : 60 * 60,
  };
}

export default MarketsPage;
