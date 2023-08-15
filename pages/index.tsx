import { ApiPromise, WsProvider } from "@polkadot/api";
import { create, isRpcSdk, ZeitgeistIpfs } from "@zeitgeistpm/sdk-next";
import LatestTrades from "components/front-page/LatestTrades";
import LearnSection from "components/front-page/LearnSection";
import NetworkStats from "components/front-page/NetworkStats";
import PopularCategories, {
  CATEGORIES,
} from "components/front-page/PopularCategories";
import HeroSlider from "components/hero-slider/HeroSlider";
import { IndexedMarketCardData } from "components/markets/market-card";
import MarketScroll from "components/markets/MarketScroll";
import { GraphQLClient } from "graphql-request";
import { Banner, getBanners } from "lib/cms/get-banners";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getNetworkStats } from "lib/gql/get-network-stats";
import { getCategoryCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
import { NextPage } from "next";

import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { isExtSigner } from "@zeitgeistpm/sdk/dist/util";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import path from "path";
import {
  getPlaiceholder,
  IGetPlaiceholderOptions,
  IGetPlaiceholderReturn,
} from "plaiceholder";
import { useEffect } from "react";
import Decimal from "decimal.js";

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

//431.71
const transaction = async (signer: ExtSigner) => {
  const wsProvider = new WsProvider("wss://bsr.zeitgeist.pm");

  // const wsProvider = new WsProvider("wss://rococo-asset-hub-rpc.polkadot.io/");
  const api = await ApiPromise.create({
    provider: wsProvider,
  });
  console.log(api.isConnected);

  const tx = api.tx.balances.transfer(signer.address, 0);

  tx.signAndSend(
    signer.address,
    {
      signer: signer.signer,
      assetId: 0,
      // tip: 10000000,
    },
    (res) => {
      console.log(res.toHuman());
      // console.log(res);
    },
  );
};

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
  const wallet = useWallet();
  const [sdk] = useSdkv2();

  useEffect(() => {
    // const signer = wallet.getSigner();
    // if (signer && isExtSigner(signer)) {
    //   transaction(signer);
    // }
    // if (isRpcSdk(sdk)) {
    //   const tx = sdk.api.tx.balances.transfer(wallet?.realAddress!, 0);
    //   if (isExtSigner(signer!)) {
    //     tx.signAndSend(
    //       signer.address,
    //       {
    //         signer: signer.signer,
    //         assetId: 0,
    //         // tip: 10000000,
    //       },
    //       (res) => {
    //         console.log(res.toHuman());
    //       },
    //     );
    //   }
    // const keyring = new Keyring({ type: "sr25519" });
    // const alice = keyring.addFromUri("//Alice", { name: "Alice default" }); //5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
    // tx.signAndSend(alice, (res) => {
    // console.log(res.toHuman());
    // });
    // }
  }, [wallet]);

  // 435.19 ZBS

  // 431.71 DOT
  return (
    <>
      <HeroSlider banners={banners} bannerPlaceHolders={bannerPlaceHolders} />
      <div data-testid="indexPage" className="main-container">
        <button
          className="bg-green"
          onClick={() => transaction(wallet.getSigner())}
        >
          TX
        </button>
        <button
          className="bg-blue"
          onClick={() => {
            const signer = wallet.getSigner();

            if (isRpcSdk(sdk)) {
              const tx = sdk.api.tx.balances.transfer(wallet?.realAddress!, 0);
              if (isExtSigner(signer!)) {
                tx.signAndSend(
                  signer.address,
                  {
                    signer: signer.signer,
                    assetId: 0,
                  },
                  (res) => {
                    console.log(res.toHuman());
                  },
                );
              }
            }
          }}
        >
          TX sdk
        </button>
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

export default IndexPage;
