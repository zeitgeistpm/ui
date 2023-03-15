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
import { Banner, getBanners } from "lib/cms/get-banners";
import path from "path";

const getPlaiceholders = (
  paths: string[],
  options?: IGetPlaiceholderOptions,
): Promise<IGetPlaiceholderReturn[]> => {
  return Promise.all(paths.map((path) => getPlaiceholder(path, options)));
};

export async function getStaticProps() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);

  const banners = await getBanners();

  const [
    featuredMarkets,
    trendingMarkets,
    categoryPlaceholders,
    bannerPlaceHolders,
    categoryCounts,
  ] = await Promise.all([
    getFeaturedMarkets(client),
    getTrendingMarkets(client),
    getPlaiceholders(
      CATEGORIES.map((cat) => `${cat.imagePath}`),
      { dir: `${path.join(process.cwd())}/public/` },
    ),
    getPlaiceholders(
      banners.map((slide) => `${slide.imageUrl}`),
      { size: 16, dir: `${path.join(process.cwd())}/public/` },
    ),
    getCategoryCounts(
      client,
      CATEGORIES.map((cat) => cat.name),
    ),
  ]);

  return {
    props: {
      banners: banners,
      featuredMarkets: featuredMarkets ?? [],
      trendingMarkets: trendingMarkets ?? [],
      categoryCounts: categoryCounts,
      categoryPlaceholders: categoryPlaceholders.map((c) => c.base64) ?? [],
      bannerPlaceHolders: bannerPlaceHolders.map((c) => c.base64) ?? [],
    },
    revalidate: 10 * 60, //10min
  };
}

const IndexPage: NextPage<{
  banners: Banner[];
  featuredMarkets: IndexedMarketCardData[];
  trendingMarkets: IndexedMarketCardData[];
  categoryCounts: number[];
  categoryPlaceholders: string[];
  bannerPlaceHolders: string[];
}> = observer(
  ({
    banners,
    trendingMarkets,
    featuredMarkets,
    categoryCounts,
    categoryPlaceholders,
    bannerPlaceHolders,
  }) => {
    return (
      <>
        <HeroSlider banners={banners} bannerPlaceHolders={bannerPlaceHolders} />
        <section data-testid="indexPage" className="main-container mt-12">
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
          <LearnSection />
        </section>
      </>
    );
  },
);

export default IndexPage;
