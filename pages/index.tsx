import LearnSection from "components/front-page/LearnSection";
import PopularCategories, {
  CATEGORIES,
} from "components/front-page/PopularCategories";
import HeroSlider from "components/hero-slider/HeroSlider";
import { IndexedMarketCardData } from "components/markets/market-card";
import MarketScroll from "components/markets/MarketScroll";
import { GraphQLClient } from "graphql-request";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getCategoryCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
import { NextPage } from "next";
import { create, ZeitgeistIpfs } from "@zeitgeistpm/sdk-next";
import LatestTrades from "components/front-page/LatestTrades";
import NetworkStats from "components/front-page/NetworkStats";
import { Banner, getBanners } from "lib/cms/get-banners";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import { getNetworkStats } from "lib/gql/get-network-stats";
import path from "path";
import {
  getPlaiceholder,
  IGetPlaiceholderOptions,
  IGetPlaiceholderReturn,
} from "plaiceholder";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { categoryCountsKey } from "lib/hooks/queries/useCategoryCounts";

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

  const banners = await getBanners();

  const [
    featuredMarkets,
    trendingMarkets,
    categoryPlaceholders,
    bannerPlaceHolders,
    stats,
  ] = await Promise.all([
    getFeaturedMarkets(client, sdk),
    getTrendingMarkets(client, sdk),
    getPlaiceholders(
      CATEGORIES.map((cat) => `${cat.imagePath}`),
      { dir: `${path.join(process.cwd())}/public/` },
    ),
    getPlaiceholders(
      banners.map((slide) => slide.imageUrl ?? ""),
      { size: 16 },
    ),
    getNetworkStats(sdk),
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
      banners: banners,
      featuredMarkets: featuredMarkets ?? [],
      trendingMarkets: trendingMarkets ?? [],
      categoryPlaceholders: categoryPlaceholders.map((c) => c.base64) ?? [],
      bannerPlaceHolders: bannerPlaceHolders.map((c) => c.base64) ?? [],
      stats,
    },
    revalidate: 1 * 60, //1min
  };
}

const IndexPage: NextPage<{
  banners: Banner[];
  featuredMarkets: IndexedMarketCardData[];
  trendingMarkets: IndexedMarketCardData[];
  categoryPlaceholders: string[];
  bannerPlaceHolders: string[];
  stats: { marketCount: number; tradersCount: number; volumeUsd: number };
}> = ({
  banners,
  trendingMarkets,
  featuredMarkets,
  categoryPlaceholders,
  bannerPlaceHolders,
  stats,
}) => {
  return (
    <>
      <HeroSlider banners={banners} bannerPlaceHolders={bannerPlaceHolders} />
      <div data-testid="indexPage" className="flex-col">
        <NetworkStats
          marketCount={stats.marketCount}
          tradersCount={stats.tradersCount}
          totalVolumeUsd={stats.volumeUsd}
        />
        {featuredMarkets.length > 0 && (
          <div className="my-[60px]">
            <MarketScroll
              title="Featured Markets"
              cta="Go to Markets"
              markets={featuredMarkets}
              link="markets"
            />
          </div>
        )}
        {/* Need link */}
        {/* <WatchHow /> */}
        <div className="mb-[60px]">
          <PopularCategories imagePlaceholders={categoryPlaceholders} />
        </div>
        <div className="flex items-center w-full justify-center bottom-[60px]">
          <LearnSection />
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
        <LatestTrades />
      </div>
    </>
  );
};

export default IndexPage;
