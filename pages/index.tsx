import LearnSection from "components/front-page/LearnSection";
import PopularCategories, {
  CATEGORIES,
} from "components/front-page/PopularCategories";
import { IndexedMarketCardData } from "components/markets/market-card";
import MarketScroll from "components/markets/MarketScroll";
import { GraphQLClient } from "graphql-request";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getCategoryCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
import { observer } from "mobx-react";
import { NextPage } from "next";
import HeroSlider from "components/hero-slider/HeroSlider";
import { slidesData } from "components/hero-slider/slides-data";

import {
  getPlaiceholder,
  IGetPlaiceholderOptions,
  IGetPlaiceholderReturn,
} from "plaiceholder";
import React from "react";
import ManageLiquidityButton from "components/liquidity/ManageLiquidityButton";

const MAIN_IMAGE_PATH = "/carousel/superbowl.png";

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
    sliderPlaceholders,
    categoryCounts,
  ] = await Promise.all([
    getFeaturedMarkets(client),
    getTrendingMarkets(client),
    getPlaiceholder(MAIN_IMAGE_PATH, { size: 32 }),
    getPlaiceholders(CATEGORIES.map((cat) => cat.imagePath)),
    getPlaiceholders(slidesData.map((slide) => slide.bg)),
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
      sliderPlaceholders,
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
  sliderPlaceholders: IGetPlaiceholderReturn[];
}> = observer(
  ({
    trendingMarkets,
    featuredMarkets,
    categoryCounts,
    categoryPlaceholders,
    sliderPlaceholders,
  }) => {
    return (
      <>
        <HeroSlider imagePlaceholders={sliderPlaceholders} />
        <div data-testid="indexPage" className="main-container">
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
          <ManageLiquidityButton poolId={10} />
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
      </>
    );
  },
);

export default IndexPage;
