import Link from "next/link";
import { observer } from "mobx-react";
import { NextPage } from "next";
import React, { FC, useEffect, useState } from "react";
import { from } from "rxjs";
import { Skeleton } from "@material-ui/lab";

import { useStore } from "lib/stores/Store";
import MarketsList from "components/markets/MarketsList";
import AspectRatioImage from "components/ui/AspectRatioImage";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";
import TrendingMarkets from "components/markets/TrendingMarkets";
import Image from "next/image";
import GlitchImage from "components/ui/GlitchImage";
import { TrendingMarketInfo } from "components/markets/TrendingMarketCard";
import { GraphQLClient } from "graphql-request";
import getTrendingMarkets from "lib/gql/trending-markets";
import { getPopularCategories, TagCounts } from "lib/gql/popular-categories";

const Category = ({
  title,
  description,
  imgURL,
  className,
  onClick,
  count,
}: {
  title: string;
  description: string;
  imgURL: string;
  onClick: () => void;
  count: number;
  className?: string;
}) => {
  return (
    <div
      className={`flex cursor-pointer ztg-transition w-full hover:bg-sky-100 dark:hover:bg-sky-1100 
      rounded-ztg-10 py-ztg-10 px-ztg-15 min-w-[235px] max-w-[45%] ${className}`}
      onClick={onClick}
    >
      {count == null ? (
        <Skeleton
          height={57}
          className="flex w-full !rounded-ztg-10 !transform-none"
        />
      ) : (
        <>
          <span className="mr-ztg-18">
            <Image src={imgURL} alt={title} width={56} height={56} />
          </span>
          <span>
            <div className="font-space text-ztg-20-150">{title}</div>
            <div className="font-lato text-ztg-14-120 text-sky-600">
              {description}
            </div>
          </span>
          <span className="ml-auto">
            <div className="font-lato text-sky-600 text-ztg-10-150 bg-sky-300 dark:bg-sky-700 rounded-ztg-5 py-ztg-3 px-ztg-5 ">
              {count}
            </div>
          </span>
        </>
      )}
    </div>
  );
};

const PopularCategories: FC<{ tagCounts: TagCounts }> = observer(
  ({ tagCounts }) => {
    const query = useMarketsUrlQuery();

    const navigateToTag = (tag: string) => {
      query.updateQuery({
        tag,
      });
    };

    return (
      <div className="flex flex-col mt-ztg-30">
        <div></div>
        <h3 className="font-space font-bold text-[24px] mb-ztg-30">
          Popular Topics
        </h3>
        <div className="flex flex-wrap w-full justify-between">
          <Category
            title="Sports"
            description=""
            imgURL="/topics/sports.png"
            count={tagCounts.sports}
            onClick={() => navigateToTag("Sports")}
          />
          <Category
            title="Politics"
            description=""
            imgURL="/topics/politics.png"
            count={tagCounts.politics}
            onClick={() => navigateToTag("Politics")}
          />
          <Category
            title="Governance"
            description=""
            imgURL="/topics/governance.png"
            count={tagCounts.governance}
            onClick={() => navigateToTag("Governance")}
          />
          <Category
            title="Crypto"
            description=""
            imgURL="/topics/crypto.png"
            count={tagCounts.crypto}
            onClick={() => navigateToTag("Crypto")}
          />
        </div>
      </div>
    );
  },
);

const FeaturedMarketContent: FC<{
  marketId: number;
  imageUrl: string;
  title: string;
  text: string;
}> = observer(({ marketId, imageUrl, title, text }) => {
  return (
    <div className="ztg-transition hover:bg-grey-100 hover:scale-105 ">
      <Link href={`/markets/${marketId}`}>
        <a>
          <AspectRatioImage
            ratio={400 / 225}
            className="w-full h-ztg-136 rounded-ztg-10 mb-ztg-22"
            imageUrl={imageUrl}
          />
          <h6 className="text-ztg-20-150 font-bold font-space">{title}</h6>
          <div className="text-ztg-12-150 font-lato text-sky-600">{text}</div>
        </a>
      </Link>
    </div>
  );
});

const FeaturedMarkets: FC = observer(() => {
  return (
    <div className="flex flex-col mt-ztg-30">
      <h5 className="font-space font-bold text-ztg-28-120 mb-ztg-30">
        Featured Markets
      </h5>
      <div className="flex">
        <div className="cursor-pointer flex flex-col flex-ztg-basis-240 flex-grow flex-shrink mr-ztg-10 min-w-0">
          <FeaturedMarketContent
            marketId={22}
            imageUrl="/featured/Kanaria_NFT.png"
            title="Kanaria NFT Price Floor"
            text="Crypto"
          />
        </div>
        <div className="cursor-pointer flex flex-col flex-ztg-basis-240 flex-grow flex-shrink ml-ztg-10 mr-ztg-10 min-w-0">
          <FeaturedMarketContent
            marketId={21}
            imageUrl="/featured/Polkadot.png"
            title="Parachain Auction Announcement Date"
            text="Crypto"
          />
        </div>
        <div className="cursor-pointer flex flex-col flex-ztg-basis-240 flex-grow flex-shrink ml-ztg-10 min-w-0">
          <FeaturedMarketContent
            marketId={23}
            imageUrl="/featured/Kusama.png"
            title="3rd round of Kusama Parachain Auction"
            text="Crypto"
          />
        </div>
      </div>
    </div>
  );
});

export async function getStaticProps() {
  const client = new GraphQLClient(
    "https://processor.bsr.zeitgeist.pm/graphql",
  );
  const trendingMarkets = await getTrendingMarkets(client);

  if (!trendingMarkets || trendingMarkets.length === 0) {
    //prevent rerender if server isn't returning markets
    throw new Error("Unable to fetch trending markets");
  }

  const categories = await getPopularCategories(client);
  return {
    props: {
      trendingMarkets: trendingMarkets,
      tagCounts: categories,
    },
    revalidate: 10 * 60 * 10, //10min
  };
}

const IndexPage: NextPage<{
  trendingMarkets: TrendingMarketInfo[];
  tagCounts: TagCounts;
}> = observer(({ trendingMarkets, tagCounts }) => {
  const store = useStore();

  return (
    <div data-test="indexPage">
      <GlitchImage
        src="/carousel/banner.png"
        className="bg-black rounded-ztg-10 max-w-[1036px] w-full"
      >
        <Image
          src="/carousel/banner.png"
          alt="Zeitgeist app banner"
          layout="responsive"
          width={1036}
          height={374}
          quality={100}
        />
      </GlitchImage>
      <TrendingMarkets markets={trendingMarkets} />
      <PopularCategories tagCounts={tagCounts} />
      {store.initialized ? (
        <MarketsList />
      ) : (
        <Skeleton
          height={300}
          className="w-full !rounded-ztg-10 !transform-none !mt-[100px]"
        />
      )}
    </div>
  );
});

export default IndexPage;
