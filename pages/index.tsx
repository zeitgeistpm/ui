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
import { useStore } from "lib/stores/Store";
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
        <div className="flex items-center w-full justify-center relative bottom-[60px]">
          <LearnSection />
        </div>
        {featuredMarkets.length > 0 && (
          <div className="mb-[60px]">
            <MarketScroll
              title="Featured Markets"
              cta="Go to Markets"
              markets={featuredMarkets}
              link="markets"
            />
          </div>
        )}
        <div className="mb-[60px]">
          <PopularCategories
            counts={categoryCounts}
            imagePlaceholders={categoryPlaceholders}
          />
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
      </div>
    );
  },
);

export default IndexPage;
