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
import Image from "next/image";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import TableChart, { getColour } from "components/ui/TableChart";
import { random } from "lodash-es";
import { FaDollarSign } from "react-icons/fa";

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
    categoryCounts,
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
    getCategoryCounts(
      client,
      CATEGORIES.map((cat) => cat.name),
    ),
    getNetworkStats(sdk),
  ]);

  return {
    props: {
      banners: banners,
      featuredMarkets: featuredMarkets ?? [],
      trendingMarkets: trendingMarkets ?? [],
      categoryCounts: categoryCounts,
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
  categoryCounts: number[];
  categoryPlaceholders: string[];
  bannerPlaceHolders: string[];
  stats: { marketCount: number; tradersCount: number; volumeUsd: number };
}> = ({
  banners,
  trendingMarkets,
  featuredMarkets,
  categoryCounts,
  categoryPlaceholders,
  bannerPlaceHolders,
  stats,
}) => {
  return (
    <>
      {/* <HeroSlider banners={banners} bannerPlaceHolders={bannerPlaceHolders} /> */}

      <div data-testid="indexPage" className="main-container relative z-1">
        <BgBallGfx />

        <HeroBanner />

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
          <PopularCategories
            counts={categoryCounts}
            imagePlaceholders={categoryPlaceholders}
          />
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

const BgBallGfx = () => (
  <div
    className="absolute flex justify-center -left-20 -top-[370px] items-center h-[740px] w-[740px] rounded-full bg-red z-0 rotate-180"
    style={{
      background:
        "linear-gradient(131.15deg, rgba(0, 102, 255, 0.022) 11.02%, rgba(254, 0, 152, 0.1) 93.27%)",
    }}
  >
    <div
      className="rotate-180 h-1/2 w-1/2 rounded-full"
      style={{
        background:
          "linear-gradient(131.15deg, rgba(0, 102, 255, 0.022) 11.02%, rgba(217, 14, 14, 0.1) 93.27%)",
      }}
    ></div>
  </div>
);

const HeroBanner = () => {
  const mockChartData = [...Array(10).keys()].map(() => {
    const v = random(4, 10);
    return { v, t: 1 };
  });

  return (
    <div className="relative main-container mt-28 md:mt-36 mb-20 z-2">
      <div className="relative flex flex-col-reverse md:flex-row md:gap-8">
        <div className="md:w-[890px] lg:w-[690px]">
          <h1 className="text-5xl mb-8">Welcome to the Future of Betting</h1>
          <h2 className="text-xl mb-8">
            Zeitgeist is a new innovative platform for predicting future events
          </h2>
          <div className="flex gap-4 mb-8">
            <button className="rounded-md bg-vermilion text-white px-6 py-3">
              Learn More
            </button>
            <button className="rounded-md bg-transparent border-2 border-black text-black px-6 py-3">
              Get Started
            </button>
          </div>
          <div className="bg-blue-300 py-3 px-4 bg-opacity-70 w-full rounded-md flex gap-2">
            <div className="flex justify-start items-center gap-2 w-1/3">
              <div>
                <FaDollarSign size={20} />
              </div>
              <div>
                <div className="font-bold text-md">Trade Volume</div>
                <div className="text-sm">24 h</div>
              </div>
            </div>
            <div className="flex center w-1/3">
              <ResponsiveContainer width={"100%"} height="65%">
                <LineChart data={mockChartData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    dot={false}
                    strokeWidth={2}
                    stroke={getColour(
                      mockChartData[0].v,
                      mockChartData[mockChartData.length - 1].v,
                    )}
                  />
                  <YAxis hide={true} domain={["dataMin", "dataMax"]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-end items-center gap-2 flex-1">
              <div>
                <div className="font-semibold text-md text-center">
                  2.5K USD
                </div>
                <div className="text-sm text-center">+2.3%</div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-64 md:h-auto relative rounded-md overflow-hidden mb-8 md:mb-0">
          <Image
            alt="Futuristic City Image"
            fill={true}
            sizes="100vw"
            className="object-cover"
            src="https://cdn.discordapp.com/attachments/826371897084215376/1138829878188327043/image.png"
          />
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
