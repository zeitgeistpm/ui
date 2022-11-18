import LearnSection from "components/front-page/LearnSection";
import PopularCategories from "components/front-page/PopularCategories";
import { IndexedMarketCardData } from "components/markets/market-card";
import MarketScroll from "components/markets/MarketScroll";
import { motion } from "framer-motion";
import { GraphQLClient } from "graphql-request";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getPopularCategories, TagCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
import { useStore } from "lib/stores/Store";
import { randomHexColor } from "lib/util";
import { observer } from "mobx-react";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPlaiceholder, IGetPlaiceholderReturn } from "plaiceholder";
import React from "react";

const demoCategories = [
  { ticker: "Vivamus tortor ipsum", color: randomHexColor() },
  { ticker: "In blandit lorem sed", color: randomHexColor() },
  { ticker: "Nulla sit amet mi", color: randomHexColor() },
  { ticker: "Quisque consectetur massa", color: randomHexColor() },
  { ticker: "Suspendisse ac", color: randomHexColor() },
  { ticker: "Sed dictum ante arcu", color: randomHexColor() },
  { ticker: "Nulla sit amet mi", color: randomHexColor() },
  { ticker: "Vivamus tortor ipsum", color: randomHexColor() },
  { ticker: "Vivamus tortor ipsum", color: randomHexColor() },
  { ticker: "In blandit lorem sed", color: randomHexColor() },
  { ticker: "Nulla sit amet mi", color: randomHexColor() },
  { ticker: "Quisque consectetur massa", color: randomHexColor() },
  { ticker: "Suspendisse ac", color: randomHexColor() },
];

const MAIN_IMAGE_PATH = "/carousel/intro_zeitgeist_avatar.png";
export async function getStaticProps() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);
  const featuredMarkets = await getFeaturedMarkets(client);
  const trendingMarkets = await getTrendingMarkets(client);

  const img = await getPlaiceholder(MAIN_IMAGE_PATH, { size: 32 });

  if (!trendingMarkets || trendingMarkets.length === 0) {
    // prevent rerender if server isn't returning markets
    // commenting for now, as production currently has no trending
    // markets and is failing to build
    // throw new Error("Unable to fetch trending markets");
  }

  const categories = await getPopularCategories(client);
  return {
    props: {
      featuredMarkets: featuredMarkets,
      trendingMarkets: trendingMarkets,
      tagCounts: categories,
      img,
    },
    revalidate: 10 * 60, //10min
  };
}

const IndexPage: NextPage<{
  featuredMarkets: IndexedMarketCardData[];
  trendingMarkets: IndexedMarketCardData[];
  tagCounts: TagCounts;
  img: IGetPlaiceholderReturn;
}> = observer(({ trendingMarkets, featuredMarkets, tagCounts, img }) => {
  const store = useStore();

  return (
    <div data-test="indexPage">
      <a
        href="https://blog.zeitgeist.pm/announcing-zeitgeist-launch-nfts/"
        target="_blank"
        rel="noreferrer"
      >
        {/* <GlitchImage
          src={MAIN_IMAGE_PATH}
        > */}
        <Image
          className="bg-black rounded-ztg-10 max-w-[1036px] w-full"
          src={MAIN_IMAGE_PATH}
          alt="Introducing Zeitgeist Avatar"
          layout="responsive"
          width={1036}
          height={374}
          quality={100}
          blurDataURL={img.base64}
          placeholder="blur"
          priority
        />
        {/* </GlitchImage> */}
      </a>
      <div className="flex items-center w-full justify-center relative bottom-[29px]">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Link href="/markets/">
            <div
              className="font-lato text-[20px] h-[58px] w-[323px] center border-2 rounded-ztg-100 bg-white"
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
      {/* <TrendingMarkets markets={trendingMarkets} /> */}
      {featuredMarkets && (
        <div className="my-[60px]">
          <MarketScroll title="Featured Markets" markets={featuredMarkets} />
        </div>
      )}
      <div className="my-[60px]">
        <MarketScroll title="Trending Markets" markets={trendingMarkets} />
      </div>
      <div className="mb-[60px]">
        <PopularCategories tagCounts={tagCounts} />
      </div>
      {/* {!!featuredMarkets && <FeaturedMarkets markets={featuredMarkets} />} */}

      {/* <MarketsList /> */}
    </div>
  );
});

export default IndexPage;
