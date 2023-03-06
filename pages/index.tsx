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
import path from "path";

import {
  getPlaiceholder,
  IGetPlaiceholderOptions,
  IGetPlaiceholderReturn,
} from "plaiceholder";
import React from "react";

const getPlaiceholders = (
  paths: string[],
  options?: IGetPlaiceholderOptions,
): Promise<IGetPlaiceholderReturn[]> => {
  return Promise.all(paths.map((path) => getPlaiceholder(path, options)));
};

export async function getStaticProps() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);

  const sliderPlaceholders = await getPlaiceholders(
    CATEGORIES.map((cat) => cat.imagePath),
    { size: 32 },
  ).catch((e) => console.error(e));

  const categoryPlaceholders = await getPlaiceholders(
    // slidesData.map((slide) => path.join(process.cwd(), slide.bg)),
    slidesData.map((slide) => slide.bg),
  ).catch((e) => console.error(e));

  const [featuredMarkets, trendingMarkets, categoryCounts] = await Promise.all([
    getFeaturedMarkets(client),
    getTrendingMarkets(client),
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
      categoryPlaceholders: categoryPlaceholders ?? [],
      sliderPlaceholders: sliderPlaceholders ?? [],
    },
    revalidate: 10 * 60, //10min
  };
}

const IndexPage: NextPage<{
  featuredMarkets: IndexedMarketCardData[];
  trendingMarkets: IndexedMarketCardData[];
  categoryCounts: number[];
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
