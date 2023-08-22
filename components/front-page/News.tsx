import GettingStartedSection from "components/front-page/GettingStartedSection";
import PopularCategories, {
  CATEGORIES,
} from "components/front-page/PopularCategories";
import HeroSlider from "components/hero-slider/HeroSlider";
import { IndexedMarketCardData } from "components/markets/market-card";
import MarketScroll from "components/markets/MarketScroll";
import { GraphQLClient } from "graphql-request";
import getFeaturedMarkets from "lib/gql/featured-markets";
import { getCategoryCounts } from "lib/gql/popular-categories";
import getTrendingMarkets from "lib/gql/trending-markets";
import { NextPage } from "next";
import { create, ZeitgeistIpfs } from "@zeitgeistpm/sdk-next";
import LatestTrades from "components/front-page/LatestTrades";
import NetworkStats from "components/front-page/NetworkStats";
import { News, getNews } from "lib/cms/get-news";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import { getNetworkStats } from "lib/gql/get-network-stats";
import path from "path";
import {
  getPlaiceholder,
  IGetPlaiceholderOptions,
  IGetPlaiceholderReturn,
} from "plaiceholder";
import Image from "next/image";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import TableChart, { getColour } from "components/ui/TableChart";
import { random } from "lodash-es";
import { FaDollarSign } from "react-icons/fa";
import ZeitgeistIcon from "components/icons/ZeitgeistIcon";
import WatchHow from "components/front-page/WatchHow";
import { isCurrentOrigin } from "lib/util/is-current-origin";
import Link from "next/link";
import { BgBallGfx } from "components/front-page/BgBallFx";
import { HeroBanner } from "components/front-page/HeroBanner";

export const NewsSection = ({
  news,
  bannerPlaceHolders,
}: {
  news: News[];
  bannerPlaceHolders: string[];
}) => {
  return (
    <div className="mb-12">
      <h2 className="sm:col-span-2 text-center sm:text-start mb-6">News</h2>
      <div className="flex flex-col md:flex-row gap-4">
        {news.map((news, index) => {
          const isExternalLink = news.ctaLink
            ? !isCurrentOrigin(news.ctaLink)
            : false;

          return (
            <Link
              href={news.ctaLink!}
              key={index}
              className="flex-1"
              target={isExternalLink ? "_blank" : "_parent"}
            >
              <div className="relative h-52 mb-3">
                <Image
                  key={index}
                  priority
                  src={news.imageUrl ?? ""}
                  alt={`Image depicting ${news.title}`}
                  placeholder="blur"
                  fill
                  blurDataURL={bannerPlaceHolders[index]}
                  sizes="100vw"
                  className="object-cover rounded-lg"
                  style={{
                    objectFit: "cover",
                  }}
                />
              </div>
              <h4 className="mb-1 font-semibold">{news.title}</h4>
              <h5 className="text-base font-light">{news.subtitle}</h5>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
