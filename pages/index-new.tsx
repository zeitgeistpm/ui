import LearnSection from "components/front-page/LearnSection";
import PopularCategories, {
  CATEGORIES,
} from "components/front-page/PopularCategories";
import { IndexedMarketCardData } from "components/markets/market-card";
import MarketScroll from "components/markets/MarketScroll";
import { motion } from "framer-motion";
import { GraphQLClient } from "graphql-request";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getCategoryCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
import { observer } from "mobx-react";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getPlaiceholder,
  IGetPlaiceholderOptions,
  IGetPlaiceholderReturn,
} from "plaiceholder";
import React from "react";
import HeroSlider from "components/hero-slider/HeroSlider";

const MAIN_IMAGE_PATH = "/carousel/intro_zeitgeist_avatar.png";

const getPlaiceholders = (
  paths: string[],
  options?: IGetPlaiceholderOptions,
): Promise<IGetPlaiceholderReturn[]> => {
  return Promise.all(paths.map((path) => getPlaiceholder(path, options)));
};

export async function getStaticProps() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);
  const [
    featuredMarkets,
    trendingMarkets,
    img,
    categoryPlaceholders,
    categoryCounts,
  ] = await Promise.all([
    getFeaturedMarkets(client),
    getTrendingMarkets(client),
    getPlaiceholder(MAIN_IMAGE_PATH, { size: 32 }),
    getPlaiceholders(CATEGORIES.map((cat) => cat.imagePath)),
    getCategoryCounts(
      client,
      CATEGORIES.map((cat) => cat.name),
    ),
  ]);

  return {
    props: {
      featuredMarkets: featuredMarkets ?? [],
      trendingMarkets: trendingMarkets ?? [],
      categoryCounts: categoryCounts,
      img,
      categoryPlaceholders,
    },
    revalidate: 10 * 60, //10min
  };
}

const IndexPage: NextPage<{
  featuredMarkets: IndexedMarketCardData[];
  trendingMarkets: IndexedMarketCardData[];
  categoryCounts: number[];
  img: IGetPlaiceholderReturn;
  categoryPlaceholders: IGetPlaiceholderReturn[];
}> = observer(
  ({
    trendingMarkets,
    featuredMarkets,
    categoryCounts,
    categoryPlaceholders,
    img,
  }) => {
    return (
      <div data-testid="indexPage">
        <a
          href="https://blog.zeitgeist.pm/announcing-zeitgeist-launch-nfts/"
          target="_blank"
          rel="noreferrer"
        >
          <Image
            className="bg-black rounded-ztg-10 max-w-[1036px] w-full"
            src={MAIN_IMAGE_PATH}
            alt="Introducing Zeitgeist Avatar"
            width={1036}
            height={374}
            quality={100}
            blurDataURL={img.base64}
            placeholder="blur"
            priority
          />
        </a>
        <div className="flex items-center w-full justify-center relative bottom-[29px]">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/markets/" data-testid="bannerButton">
              <div
                className=" text-[20px] h-[58px] w-[323px] center border-2 rounded-ztg-100 bg-white"
                style={{
                  boxShadow:
                    "0px 70px 28px rgba(0, 0, 0, 0.01), 0px 40px 24px rgba(0, 0, 0, 0.05), 0px 18px 18px rgba(0, 0, 0, 0.09), 0px 4px 10px rgba(0, 0, 0, 0.1), 0px 0px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                Go to All Markets
              </div>
            </Link>
          </motion.div>
        </div>
        <LearnSection />
        {featuredMarkets.length > 0 && (
          <div className="my-[60px]">
            <MarketScroll title="Featured Markets" markets={featuredMarkets} />
          </div>
        )}
        {trendingMarkets.length > 0 && (
          <div className="my-[60px]">
            <MarketScroll title="Trending Markets" markets={trendingMarkets} />
          </div>
        )}
        <div className="mb-[60px]">
          <PopularCategories
            counts={categoryCounts}
            imagePlaceholders={categoryPlaceholders}
          />
        </div>
      </div>
    );
  },
);

export default IndexPage;
