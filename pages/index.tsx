import { create, ZeitgeistIpfs } from "@zeitgeistpm/sdk-next";
import { BgBallGfx } from "components/front-page/BgBallFx";
import { GenericChainProperties } from "@polkadot/types";
import GettingStartedSection from "components/front-page/GettingStartedSection";
import { HeroBanner } from "components/front-page/HeroBanner";
import LatestTrades from "components/front-page/LatestTrades";
import NetworkStats from "components/front-page/NetworkStats";
import { NewsSection } from "components/front-page/News";
import PopularCategories, {
  CATEGORIES,
} from "components/front-page/PopularCategories";
import WatchHow from "components/front-page/WatchHow";
import { IndexedMarketCardData } from "components/markets/market-card";
import MarketScroll from "components/markets/MarketScroll";
import { GraphQLClient } from "graphql-request";
import { getNews, News } from "lib/cms/get-news";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getNetworkStats } from "lib/gql/get-network-stats";
import { getCategoryCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
import { AssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import {
  getZTGHistory,
  ZtgPriceHistory,
} from "lib/hooks/queries/useAssetUsdPrice";
import { NextPage } from "next";
import path from "path";
import {
  getPlaiceholder,
  IGetPlaiceholderOptions,
  IGetPlaiceholderReturn,
} from "plaiceholder";

const getPlaiceholders = (
  paths: string[],
  options?: IGetPlaiceholderOptions,
): Promise<IGetPlaiceholderReturn[]> => {
  return Promise.all(paths.map((path) => getPlaiceholder(path, options)));
};

export async function getStaticProps() {
  const client = new GraphQLClient(graphQlEndpoint);
  const sdk = await create({
    provider: endpointOptions.map((e) => e.value),
    indexer: graphQlEndpoint,
    storage: ZeitgeistIpfs(),
  });

  const news = await getNews();

  const [
    featuredMarkets,
    trendingMarkets,
    bannerPlaceholder,
    categoryPlaceholders,
    newsImagePlaceholders,
    categoryCounts,
    stats,
    ztgHistory,
    chainProperties,
  ] = await Promise.all([
    getFeaturedMarkets(client, sdk),
    getTrendingMarkets(client, sdk),
    getPlaiceholder(`/banner.png`),
    getPlaiceholders(
      CATEGORIES.map((cat) => `${cat.imagePath}`),
      { dir: `${path.join(process.cwd())}/public/` },
    ),
    getPlaiceholders(
      news.map((slide) => slide.imageUrl ?? ""),
      { size: 16 },
    ),
    getCategoryCounts(
      client,
      CATEGORIES.map((cat) => cat.name),
    ),
    getNetworkStats(sdk),
    getZTGHistory(),
    sdk.api.rpc.system.properties(),
  ]);

  return {
    props: {
      news: news,
      featuredMarkets: featuredMarkets ?? [],
      trendingMarkets: trendingMarkets ?? [],
      bannerPlaceholder: bannerPlaceholder.base64 ?? "",
      categoryCounts: categoryCounts,
      categoryPlaceholders: categoryPlaceholders.map((c) => c.base64) ?? [],
      newsImagePlaceholders: newsImagePlaceholders.map((c) => c.base64) ?? [],
      stats,
      ztgHistory,
      chainProperties: chainProperties.toHuman(),
    },
    revalidate: 1 * 60, //1min
  };
}

const IndexPage: NextPage<{
  news: News[];
  featuredMarkets: IndexedMarketCardData[];
  trendingMarkets: IndexedMarketCardData[];
  categoryCounts: number[];
  categoryPlaceholders: string[];
  newsImagePlaceholders: string[];
  bannerPlaceholder: string;
  stats: { marketCount: number; tradersCount: number; volumeUsd: number };
  ztgHistory: ZtgPriceHistory;
  chainProperties: GenericChainProperties;
}> = ({
  news,
  trendingMarkets,
  featuredMarkets,
  bannerPlaceholder,
  categoryCounts,
  categoryPlaceholders,
  newsImagePlaceholders,
  stats,
  ztgHistory,
  chainProperties,
}) => {
  return (
    <>
      <div data-testid="indexPage" className="main-container relative z-1">
        <BgBallGfx />

        <HeroBanner
          bannerPlaceholder={bannerPlaceholder}
          ztgHistory={ztgHistory}
          chainProperties={chainProperties}
        />

        <div className="mb-12">
          <NetworkStats
            marketCount={stats.marketCount}
            tradersCount={stats.tradersCount}
            totalVolumeUsd={stats.volumeUsd}
          />
        </div>

        {featuredMarkets.length > 0 && (
          <div className="mb-12">
            <MarketScroll
              title="Promoted Markets"
              cta="Go to Markets"
              markets={featuredMarkets}
              link="markets"
            />
          </div>
        )}

        <NewsSection news={news} imagePlaceholders={newsImagePlaceholders} />

        <div className="mb-12">
          <WatchHow />
        </div>

        {trendingMarkets.length > 0 && (
          <div className="my-[60px]">
            <MarketScroll
              title="Trending Markets"
              cta="Go to Markets"
              markets={trendingMarkets}
              link="markets"
            />
          </div>
        )}

        <div className="mb-12">
          <PopularCategories
            counts={categoryCounts}
            imagePlaceholders={categoryPlaceholders}
          />
        </div>

        <LatestTrades />

        <div className="flex items-center w-full justify-center mb-12">
          <GettingStartedSection />
        </div>
      </div>
    </>
  );
};

export default IndexPage;
