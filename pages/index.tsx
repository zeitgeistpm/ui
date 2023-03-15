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
import React, { useEffect } from "react";
import { Banner, getBanners } from "lib/cms/get-banners";
import path from "path";
import { useStore } from "lib/stores/Store";
import { getWallets } from "@talismn/connect-wallets";
import { flowResult } from "mobx";

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
    const store = useStore();
    const { wallets, sdk } = store;
    console.log(wallets);
    console.log(wallets.connected);
    console.log(wallets.activeAccount);

    const isNovaWallet =
      //@ts-ignore
      typeof window === "object" && window.walletExtension?.isNovaWallet;
    const walletExtension =
      //@ts-ignore
      typeof window === "object" && window.walletExtension;

    const injectedWeb3 =
      //@ts-ignore
      typeof window === "object" && window.injectedWeb3;

    console.log(isNovaWallet);
    console.log();

    useEffect(() => {
      const isNovaWallet =
        //@ts-ignore
        typeof window === "object" && window.walletExtension?.isNovaWallet;

      console.log(wallets?.connected);

      if (wallets?.connected === false && sdk?.api && store) {
        console.log("called");

        // getWallets()
        //   .find((wallet) => wallet.extensionName === "polkadot-js")
        //   .enable("Zeitgiest");
        flowResult(wallets.connectWallet("polkadot-js", true));
      }
    }, [wallets.connected, sdk?.api, store]);

    return (
      <>
        <HeroSlider banners={banners} bannerPlaceHolders={bannerPlaceHolders} />
        <div data-testid="indexPage" className="main-container">
          <div className="flex items-center w-full justify-center relative bottom-[60px]">
            <LearnSection />
          </div>
          <div className="font-bold text-red-600 text-[20px]">
            Nova:{JSON.stringify(isNovaWallet)}
          </div>
          <div className="font-bold text-red-600 text-[20px]">
            Wallet:{JSON.stringify(walletExtension)}
          </div>
          <div className="font-bold text-red-600 text-[20px]">
            Web3:{JSON.stringify(injectedWeb3)}
          </div>
          <div className="font-bold text-red-600 text-[20px]">
            Connected:{JSON.stringify(wallets?.activeAccount)}
          </div>
          <div className="font-bold text-red-600 text-[20px]">
            Balances:{JSON.stringify(wallets?.activeBalance)}
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
