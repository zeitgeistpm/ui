import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { Loader } from "components/ui/Loader";

/**
 * Home page - Redirects to /markets
 *
 * The original home page code is preserved below (commented out)
 * in case you want to restore it in the future.
 */
const IndexPage: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to markets page on mount
    router.replace("/markets");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ztg-primary-500">
      <Loader className="w-32" type="dots" />
    </div>
  );
};

export default IndexPage;

/* ============================================================================
 * ORIGINAL HOME PAGE CODE (COMMENTED OUT)
 * ============================================================================
 *
 * To restore the original home page, uncomment the code below and
 * comment out the redirect implementation above.
 *

import { GenericChainProperties } from "@polkadot/types";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ZeitgeistIpfs, create } from "@zeitgeistpm/sdk";
import { BgBallGfx } from "components/front-page/BgBallFx";
import GettingStartedSection from "components/front-page/GettingStartedSection";
import { HeroBanner } from "components/front-page/HeroBanner";
import LatestTrades from "components/front-page/LatestTrades";
import LatestTradesCompact from "components/front-page/LatestTradesCompact";
import NetworkStats from "components/front-page/NetworkStats";
import { NewsSection } from "components/front-page/News";
import PopularCategories, {
  CATEGORIES,
} from "components/front-page/PopularCategories";
import { Topics } from "components/front-page/Topics";
import TrendingMarketsCompact from "components/front-page/TrendingMarketsCompact";
import WatchHow from "components/front-page/WatchHow";
import MarketScroll from "components/markets/MarketScroll";
import MarketCard from "components/markets/market-card";
import { GraphQLClient } from "graphql-request";
import { getCmsMarketCardMetadataForAllMarkets } from "lib/cms/markets";
import { CmsNews, getCmsNews } from "lib/cms/news";
import {
  CmsTopicHeader,
  getCmsTopicHeaders,
  marketsForTopic,
} from "lib/cms/topics";
import { endpointOptions, environment, graphQlEndpoint } from "lib/constants";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getNetworkStats } from "lib/gql/get-network-stats";
import { MarketStats } from "lib/gql/markets-stats";
import { getCategoryCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
import { marketCmsDatakeyForMarket } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import {
  ZtgPriceHistory,
  getZTGHistory,
} from "lib/hooks/queries/useAssetUsdPrice";
import { categoryCountsKey } from "lib/hooks/queries/useCategoryCounts";
import { getPlaiceholders } from "lib/util/getPlaiceHolders";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import path from "path";
import { getPlaiceholder } from "plaiceholder";

export async function getStaticProps() {
  const client = new GraphQLClient(graphQlEndpoint);
  const sdk = await create({
    provider: endpointOptions.map((e) => e.value),
    indexer: graphQlEndpoint,
    storage: ZeitgeistIpfs(),
  });

  const [news, cmsTopics] = await Promise.all([
    getCmsNews(),
    getCmsTopicHeaders(),
  ]);

  const [
    featuredMarkets,
    trendingMarkets,
    bannerPlaceholder,
    categoryPlaceholders,
    newsImagePlaceholders,
    topicImagePlaceholders,
    stats,
    ztgHistory,
    chainProperties,
    marketsCmsData,
    topicsMarkets,
  ] = await Promise.all([
    getFeaturedMarkets(client, sdk),
    getTrendingMarkets(client, sdk),
    getPlaiceholder(`/banner.png`),
    getPlaiceholders(
      CATEGORIES?.map((cat) => `${cat.imagePath}`),
      {
        dir: `${path.join(process.cwd())}/public/`,
      },
    ),
    getPlaiceholders(
      news.map((slide) => slide.image ?? ""),
      { size: 16 },
    ),
    getPlaiceholders(
      cmsTopics.map((topic) => topic.thumbnail ?? ""),
      { size: 16 },
    ),
    getNetworkStats(sdk),
    getZTGHistory(),
    sdk.api.rpc.system.properties(),
    getCmsMarketCardMetadataForAllMarkets(),
    Promise.all(
      cmsTopics.map((topic) =>
        marketsForTopic(topic, sdk.indexer, { limit: 3 }).then((markets) => ({
          topic,
          markets,
        })),
      ),
    ),
  ]);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery([categoryCountsKey], () =>
    getCategoryCounts(
      sdk.indexer.client,
      CATEGORIES?.map((c) => c.name),
    ),
  );

  for (const marketCmsData of marketsCmsData) {
    if (marketCmsData.marketId) {
      queryClient.setQueryData(
        marketCmsDatakeyForMarket(marketCmsData.marketId),
        marketCmsData,
      );
    }
  }

  for (const market of [...featuredMarkets, ...trendingMarkets]) {
    const cmsData = marketsCmsData.find((m) => m.marketId === market.marketId);
    if (cmsData?.question) market.question = cmsData.question;
    if (cmsData?.imageUrl) market.img = cmsData.imageUrl;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      news: news,
      featuredMarkets: featuredMarkets ?? [],
      trendingMarkets: trendingMarkets ?? [],
      bannerPlaceholder: bannerPlaceholder.base64 ?? "",
      categoryPlaceholders: categoryPlaceholders.map((c) => c.base64) ?? [],
      newsImagePlaceholders: newsImagePlaceholders.map((c) => c.base64) ?? [],
      topicImagePlaceholders: topicImagePlaceholders.map((c) => c.base64) ?? [],
      stats,
      ztgHistory,
      chainProperties: chainProperties.toPrimitive(),
      cmsTopics,
      topicsMarkets,
    },
    revalidate:
      environment === "production"
        ? 5 * 60 //5min
        : 60 * 60,
  };
}

const IndexPage: NextPage<{
  news: CmsNews[];
  featuredMarkets: FullMarketFragment[];
  trendingMarkets: FullMarketFragment[];
  categoryPlaceholders: string[];
  newsImagePlaceholders: string[];
  topicImagePlaceholders: string[];
  bannerPlaceholder: string;
  stats: { marketCount: number; tradersCount: number; volumeUsd: number };
  ztgHistory: ZtgPriceHistory;
  chainProperties: GenericChainProperties;
  cmsTopics: CmsTopicHeader[];
  topicsMarkets: {
    topic: CmsTopicHeader;
    markets: { market: FullMarketFragment; stats: MarketStats }[];
  }[];
}> = ({
  news,
  trendingMarkets,
  featuredMarkets,
  bannerPlaceholder,
  categoryPlaceholders,
  newsImagePlaceholders,
  topicImagePlaceholders,
  stats,
  ztgHistory,
  chainProperties,
  cmsTopics,
  topicsMarkets,
}) => {
  const router = useRouter();
  const topicSlug = (router.query?.topic as string) ?? cmsTopics[0]?.slug;
  const topic = topicsMarkets.find((t) => t.topic.slug === topicSlug);

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

        {process.env.NEXT_PUBLIC_SHOW_TOPICS === "false" ? (
          <div className="relative z-30 mb-12">
            <div className="mb-8 flex gap-2">
              <Topics
                topics={cmsTopics}
                selectedTopic={topicSlug}
                onClick={(topic) => {
                  router.push(
                    { query: { ...router.query, topic: topic.slug } },
                    undefined,
                    { shallow: true },
                  );
                }}
                imagePlaceholders={topicImagePlaceholders}
              />
            </div>

            {topic && topic.topic.marketIds && (
              <>
                <div className="mb-4 flex w-full flex-col gap-3 md:flex-row">
                  {topic.markets.map(({ market, stats }) => (
                    <MarketCard
                      key={market.marketId}
                      market={market}
                      numParticipants={stats.participants}
                      liquidity={stats.liquidity}
                    />
                  ))}
                </div>
                <Link href={`/topics/${topic.topic.slug}`}>
                  <div className="pl-2 text-sm font-light text-blue-600">
                    Go to <b className="font-bold">{topic.topic.title}</b>{" "}
                    Markets ({topic.topic.marketIds?.length ?? 0})
                  </div>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="mb-12">
            <NetworkStats
              marketCount={stats.marketCount}
              tradersCount={stats.tradersCount}
              totalVolumeUsd={stats.volumeUsd}
            />
          </div>
        )}

        {featuredMarkets.length > 0 && (
          <div className="mb-12">
            <MarketScroll
              title="Featured Markets"
              cta="Go to Markets"
              markets={featuredMarkets}
              link="markets"
            />
          </div>
        )}

        {/* <div className="mb-12 flex w-full flex-col gap-8 md:flex-row">
          <div className="flex w-full flex-col gap-y-6">
            <div className="flex items-center">
              <div className="text-xl font-bold">Trending Markets</div>
              <Link
                href="/markets"
                className="ml-auto rounded-md bg-misty-harbor p-1 text-xs"
              >
                More Markets
              </Link>
            </div>
            <TrendingMarketsCompact markets={trendingMarkets} />
          </div>

          <div className="flex w-full flex-col gap-y-6">
            <div className="flex items-center ">
              <div className="text-xl font-bold">Latest Trades</div>
              <Link
                href="/latest-trades"
                className="ml-auto rounded-md bg-misty-harbor p-1 text-xs"
              >
                All Trades
              </Link>
            </div>
            <LatestTradesCompact />
          </div>
        </div> *\/}

        {/* <div className="mb-12">
          <PopularCategories imagePlaceholders={categoryPlaceholders} />
        </div> *\/}

        {/* <NewsSection news={news} imagePlaceholders={newsImagePlaceholders} /> *\/}

        <div className="mb-12">
          <WatchHow />
        </div>

        <div className="mb-12 flex w-full items-center justify-center">
          <GettingStartedSection />
        </div>
      </div>
    </>
  );
};

export default IndexPage;

 * ============================================================================ */
