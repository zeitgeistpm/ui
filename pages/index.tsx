import { observer } from "mobx-react";
import { NextPage } from "next";
import React, { FC } from "react";

import { Skeleton } from "@material-ui/lab";

import { useStore } from "lib/stores/Store";
import MarketsList from "components/markets/MarketsList";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";
import TrendingMarkets from "components/markets/TrendingMarkets";
import Image from "next/image";
import GlitchImage from "components/ui/GlitchImage";
import { TrendingMarketInfo } from "components/markets/TrendingMarketCard";
import { GraphQLClient } from "graphql-request";
import getTrendingMarkets from "lib/gql/trending-markets";
import { getPopularCategories, TagCounts } from "lib/gql/popular-categories";
import { getPlaiceholder, IGetPlaiceholderReturn } from "plaiceholder";
import Link from "next/link";
import PopularCategories from "components/front-page/PopularCategories";
import MarketScroll from "components/markets/MarketScroll";

const MAIN_IMAGE_PATH = "/carousel/intro_zeitgeist_avatar.png";

export async function getStaticProps() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);
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
      trendingMarkets: trendingMarkets,
      tagCounts: categories,
      img,
    },
    revalidate: 10 * 60, //10min
  };
}

const IndexPage: NextPage<{
  trendingMarkets: TrendingMarketInfo[];
  tagCounts: TagCounts;
  img: IGetPlaiceholderReturn;
}> = observer(({ trendingMarkets, tagCounts, img }) => {
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
        <Link href="/markets/">
          <a
            className="font-lato text-[20px] h-[58px] w-[323px] center border-2 rounded-ztg-100 bg-white"
            style={{
              boxShadow:
                "0px 70px 28px rgba(0, 0, 0, 0.01), 0px 40px 24px rgba(0, 0, 0, 0.05), 0px 18px 18px rgba(0, 0, 0, 0.09), 0px 4px 10px rgba(0, 0, 0, 0.1), 0px 0px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            Go to All Markets
          </a>
        </Link>
      </div>
      <TrendingMarkets markets={trendingMarkets} />
      <PopularCategories tagCounts={tagCounts} />
      <MarketScroll title="Trending Markets" markets={[{}, {}, {}, {}, {}]} />
      {/* <MarketsList /> */}
    </div>
  );
});

export default IndexPage;
