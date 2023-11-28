import { GenericChainProperties } from "@polkadot/types";
import { create, ZeitgeistIpfs } from "@zeitgeistpm/sdk";
import { BgBallGfx } from "components/front-page/BgBallFx";
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
import { endpointOptions, environment, graphQlEndpoint } from "lib/constants";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getNetworkStats } from "lib/gql/get-network-stats";
import { getCategoryCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
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
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { categoryCountsKey } from "lib/hooks/queries/useCategoryCounts";
import Link from "next/link";

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
    getNetworkStats(sdk),
    getZTGHistory(),
    sdk.api.rpc.system.properties(),
  ]);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery([categoryCountsKey], () =>
    getCategoryCounts(
      sdk.indexer.client,
      CATEGORIES.map((c) => c.name),
    ),
  );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      news: news,
      featuredMarkets: featuredMarkets ?? [],
      trendingMarkets: trendingMarkets ?? [],
      bannerPlaceholder: bannerPlaceholder.base64 ?? "",
      categoryPlaceholders: categoryPlaceholders.map((c) => c.base64) ?? [],
      newsImagePlaceholders: newsImagePlaceholders.map((c) => c.base64) ?? [],
      stats,
      ztgHistory,
      chainProperties: chainProperties.toPrimitive(),
    },
    revalidate:
      environment === "production"
        ? 1 * 60 //1min
        : 60 * 60,
  };
}

const IndexPage: NextPage<{
  news: News[];
  featuredMarkets: IndexedMarketCardData[];
  trendingMarkets: IndexedMarketCardData[];
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
  categoryPlaceholders,
  newsImagePlaceholders,
  stats,
  ztgHistory,
  chainProperties,
}) => {
  return (
    <>
      <div
        data-testid="indexPage"
        className="main-container z-1 relative pt-1 md:pt-1"
      >
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
          <PopularCategories imagePlaceholders={categoryPlaceholders} />
        </div>
        <div className="mb-12 flex flex-col gap-4">
          <LatestTrades />
          <Link
            className="w-full text-center text-ztg-blue"
            href={"/latest-trades"}
          >
            View more
          </Link>
        </div>

        <div className="mb-12 flex w-full items-center justify-center">
          <GettingStartedSection />
        </div>
      </div>
    </>
  );
};

export default IndexPage;
