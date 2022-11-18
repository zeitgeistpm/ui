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
      <div className="my-[60px]">
        <MarketScroll
          title="Trending Markets"
          markets={trendingMarkets}
          // markets={[
          //   {
          //     marketId: 1,
          //     img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAABACAMAAAANpPgjAAAANlBMVEXkLyb////kLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLyYif3JYAAAAEXRSTlMAABAgMEBQYHCAj5+vv8/f7/4ucL8AAAQdSURBVFjD7ZhRt6MqDIV3gQ1EDbL//5+9D9pae9tTe8Yz8zCTF11L5CMhCSTAdyQVm9wBAONkVnj818smH2NjGZoWAQCs720s8WfZeZi1yT1bklqNP8XOY9dOHtmSWg3ns6PNepQnbEkjz2WHYTd9d6tkXlVkMd99dp7IzjtjewZ8lrQhyFSnu0HlNHbYoYebpe/YkhvvHIKn6V3v2XzCRpckB8rqFeN5++2SxuwPHsb9ADkA1C5J83ns2KcI8CU7bLuBYRt1TozFdVdfsIskKW+v/ey89pIdNjuXd45+Mju0G6+cHWOv2C0CSNfI8tuIr9BnsfeZPACY36J/hM3bgIbfzW4JiPozequnNcVcA/1H2X3IzJW13eCpv0upv84Oe9uOK5w3+PBzbD7kNbudnXE1QjiPPfBL9jWnqADT14fox+wsOb9io6zGTvRz2Wu+Lmnor9hIXZrteqs77ywZr2FkMU8bO+/rhalaf39p+pS9zalWE4A0S5Lta4a2hXo+855q91e2NlpmLnZVLnKrVSTJwoHcEqyjj+kQvfz/fu7u7u0xvY3xQD6PQ5cgqZVwKLwf65InMh+qS7g40JodDyqfv8TPw4FZLpebY2Bb8bE6MtXRn3Gnemj5cdhW/3EdefUuM7+KVYZjLlt23vFwGk6H8Z9Lnh5ryf9fAo4Z71PwE0/BU6cZcziRG8v01Dfxymmb8RQwh/YKga+i1Ydf05/mX02Pt9liMn7D/1jG9m7qt+y10TAcXgGzTe3QrMfYVxv4aEY+dQQym03eP5juI/Z+HTeZvznFt9knyD/2X8b2Pyf43fIr/fN/7L+GHTV5P5OdGEAmkoxAIAGEajUiMiIxREYAgSmwmlXeXVYjEhOSWUYgSaZEkgnrYznxAtNKQWK4RMbAdIlMcDGr57WwLFJE7JJ6MhlcNBkAyilHuevSmix1pSpJjWuVtHT51se1YHa4CAkuhllGeegqcOWuRDX68lPFqMZR4zP2vGc3lSjV3FVZ1ZhclUxw1fqCbZJRPmm4wNVVQDmqPGpWgysjWjG5zaJp9ikvbNOO3TWiqAGmEZQDrtGMcJFySO417Ni5S0Z1+eUCl5TWYt6qhqa4dhSWBg6XxyCnWvcdW8owOWDyK1tazLWwJY07tstllFQvF7hGNVDdvaKpddlN75vNJ7mckrhjT+oxqwHDpnclI9qVjSzt2JpMRrWudIGLroFyAFHdm+ZRLfvdfru1lX3dwut+mzxIlq/bttjcBgkL2ybN1GyzRpOKS9FklFfNAS5GyeQAqkagK8+SeryxJc1FTik9sMMsK2sjcbO5pIqbzQvvmgUaLwv70jQiMSAxMa0Ri8QQaDls8U2mJb4TwH18RybEUtMaxktgr5kigSTDGvok5bv45u9Mpz7s89p/U2K/e/R3nlkAAAAASUVORK5CYII=",
          //     question: "Who will win the 2022 Men's T20 Cricket World Cup?",
          //     status: "Proposed",
          //     categories: [...demoCategories],
          //     prediction: demoCategories[2].ticker,
          //     volume: 456032,
          //   },
          //   {
          //     marketId: 1,
          //     img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAABACAMAAAANpPgjAAAANlBMVEXkLyb////kLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLyYif3JYAAAAEXRSTlMAABAgMEBQYHCAj5+vv8/f7/4ucL8AAAQdSURBVFjD7ZhRt6MqDIV3gQ1EDbL//5+9D9pae9tTe8Yz8zCTF11L5CMhCSTAdyQVm9wBAONkVnj818smH2NjGZoWAQCs720s8WfZeZi1yT1bklqNP8XOY9dOHtmSWg3ns6PNepQnbEkjz2WHYTd9d6tkXlVkMd99dp7IzjtjewZ8lrQhyFSnu0HlNHbYoYebpe/YkhvvHIKn6V3v2XzCRpckB8rqFeN5++2SxuwPHsb9ADkA1C5J83ns2KcI8CU7bLuBYRt1TozFdVdfsIskKW+v/ey89pIdNjuXd45+Mju0G6+cHWOv2C0CSNfI8tuIr9BnsfeZPACY36J/hM3bgIbfzW4JiPozequnNcVcA/1H2X3IzJW13eCpv0upv84Oe9uOK5w3+PBzbD7kNbudnXE1QjiPPfBL9jWnqADT14fox+wsOb9io6zGTvRz2Wu+Lmnor9hIXZrteqs77ywZr2FkMU8bO+/rhalaf39p+pS9zalWE4A0S5Lta4a2hXo+855q91e2NlpmLnZVLnKrVSTJwoHcEqyjj+kQvfz/fu7u7u0xvY3xQD6PQ5cgqZVwKLwf65InMh+qS7g40JodDyqfv8TPw4FZLpebY2Bb8bE6MtXRn3Gnemj5cdhW/3EdefUuM7+KVYZjLlt23vFwGk6H8Z9Lnh5ryf9fAo4Z71PwE0/BU6cZcziRG8v01Dfxymmb8RQwh/YKga+i1Ydf05/mX02Pt9liMn7D/1jG9m7qt+y10TAcXgGzTe3QrMfYVxv4aEY+dQQym03eP5juI/Z+HTeZvznFt9knyD/2X8b2Pyf43fIr/fN/7L+GHTV5P5OdGEAmkoxAIAGEajUiMiIxREYAgSmwmlXeXVYjEhOSWUYgSaZEkgnrYznxAtNKQWK4RMbAdIlMcDGr57WwLFJE7JJ6MhlcNBkAyilHuevSmix1pSpJjWuVtHT51se1YHa4CAkuhllGeegqcOWuRDX68lPFqMZR4zP2vGc3lSjV3FVZ1ZhclUxw1fqCbZJRPmm4wNVVQDmqPGpWgysjWjG5zaJp9ikvbNOO3TWiqAGmEZQDrtGMcJFySO417Ni5S0Z1+eUCl5TWYt6qhqa4dhSWBg6XxyCnWvcdW8owOWDyK1tazLWwJY07tstllFQvF7hGNVDdvaKpddlN75vNJ7mckrhjT+oxqwHDpnclI9qVjSzt2JpMRrWudIGLroFyAFHdm+ZRLfvdfru1lX3dwut+mzxIlq/bttjcBgkL2ybN1GyzRpOKS9FklFfNAS5GyeQAqkagK8+SeryxJc1FTik9sMMsK2sjcbO5pIqbzQvvmgUaLwv70jQiMSAxMa0Ri8QQaDls8U2mJb4TwH18RybEUtMaxktgr5kigSTDGvok5bv45u9Mpz7s89p/U2K/e/R3nlkAAAAASUVORK5CYII=",
          //     question: "Who will win the 2022 Men's T20 Cricket World Cup?",
          //     status: "Proposed",
          //     categories: [...demoCategories],
          //     prediction: demoCategories[2].ticker,
          //     volume: 456032,
          //   },
          //   {
          //     marketId: 1,
          //     img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAABACAMAAAANpPgjAAAANlBMVEXkLyb////kLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLyYif3JYAAAAEXRSTlMAABAgMEBQYHCAj5+vv8/f7/4ucL8AAAQdSURBVFjD7ZhRt6MqDIV3gQ1EDbL//5+9D9pae9tTe8Yz8zCTF11L5CMhCSTAdyQVm9wBAONkVnj818smH2NjGZoWAQCs720s8WfZeZi1yT1bklqNP8XOY9dOHtmSWg3ns6PNepQnbEkjz2WHYTd9d6tkXlVkMd99dp7IzjtjewZ8lrQhyFSnu0HlNHbYoYebpe/YkhvvHIKn6V3v2XzCRpckB8rqFeN5++2SxuwPHsb9ADkA1C5J83ns2KcI8CU7bLuBYRt1TozFdVdfsIskKW+v/ey89pIdNjuXd45+Mju0G6+cHWOv2C0CSNfI8tuIr9BnsfeZPACY36J/hM3bgIbfzW4JiPozequnNcVcA/1H2X3IzJW13eCpv0upv84Oe9uOK5w3+PBzbD7kNbudnXE1QjiPPfBL9jWnqADT14fox+wsOb9io6zGTvRz2Wu+Lmnor9hIXZrteqs77ywZr2FkMU8bO+/rhalaf39p+pS9zalWE4A0S5Lta4a2hXo+855q91e2NlpmLnZVLnKrVSTJwoHcEqyjj+kQvfz/fu7u7u0xvY3xQD6PQ5cgqZVwKLwf65InMh+qS7g40JodDyqfv8TPw4FZLpebY2Bb8bE6MtXRn3Gnemj5cdhW/3EdefUuM7+KVYZjLlt23vFwGk6H8Z9Lnh5ryf9fAo4Z71PwE0/BU6cZcziRG8v01Dfxymmb8RQwh/YKga+i1Ydf05/mX02Pt9liMn7D/1jG9m7qt+y10TAcXgGzTe3QrMfYVxv4aEY+dQQym03eP5juI/Z+HTeZvznFt9knyD/2X8b2Pyf43fIr/fN/7L+GHTV5P5OdGEAmkoxAIAGEajUiMiIxREYAgSmwmlXeXVYjEhOSWUYgSaZEkgnrYznxAtNKQWK4RMbAdIlMcDGr57WwLFJE7JJ6MhlcNBkAyilHuevSmix1pSpJjWuVtHT51se1YHa4CAkuhllGeegqcOWuRDX68lPFqMZR4zP2vGc3lSjV3FVZ1ZhclUxw1fqCbZJRPmm4wNVVQDmqPGpWgysjWjG5zaJp9ikvbNOO3TWiqAGmEZQDrtGMcJFySO417Ni5S0Z1+eUCl5TWYt6qhqa4dhSWBg6XxyCnWvcdW8owOWDyK1tazLWwJY07tstllFQvF7hGNVDdvaKpddlN75vNJ7mckrhjT+oxqwHDpnclI9qVjSzt2JpMRrWudIGLroFyAFHdm+ZRLfvdfru1lX3dwut+mzxIlq/bttjcBgkL2ybN1GyzRpOKS9FklFfNAS5GyeQAqkagK8+SeryxJc1FTik9sMMsK2sjcbO5pIqbzQvvmgUaLwv70jQiMSAxMa0Ri8QQaDls8U2mJb4TwH18RybEUtMaxktgr5kigSTDGvok5bv45u9Mpz7s89p/U2K/e/R3nlkAAAAASUVORK5CYII=",
          //     question: "Who will win the 2022 Men's T20 Cricket World Cup?",
          //     status: "Proposed",
          //     categories: [...demoCategories],
          //     prediction: demoCategories[2].ticker,
          //     volume: 456032,
          //   },
          //   {
          //     marketId: 1,
          //     img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAABACAMAAAANpPgjAAAANlBMVEXkLyb////kLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLyYif3JYAAAAEXRSTlMAABAgMEBQYHCAj5+vv8/f7/4ucL8AAAQdSURBVFjD7ZhRt6MqDIV3gQ1EDbL//5+9D9pae9tTe8Yz8zCTF11L5CMhCSTAdyQVm9wBAONkVnj818smH2NjGZoWAQCs720s8WfZeZi1yT1bklqNP8XOY9dOHtmSWg3ns6PNepQnbEkjz2WHYTd9d6tkXlVkMd99dp7IzjtjewZ8lrQhyFSnu0HlNHbYoYebpe/YkhvvHIKn6V3v2XzCRpckB8rqFeN5++2SxuwPHsb9ADkA1C5J83ns2KcI8CU7bLuBYRt1TozFdVdfsIskKW+v/ey89pIdNjuXd45+Mju0G6+cHWOv2C0CSNfI8tuIr9BnsfeZPACY36J/hM3bgIbfzW4JiPozequnNcVcA/1H2X3IzJW13eCpv0upv84Oe9uOK5w3+PBzbD7kNbudnXE1QjiPPfBL9jWnqADT14fox+wsOb9io6zGTvRz2Wu+Lmnor9hIXZrteqs77ywZr2FkMU8bO+/rhalaf39p+pS9zalWE4A0S5Lta4a2hXo+855q91e2NlpmLnZVLnKrVSTJwoHcEqyjj+kQvfz/fu7u7u0xvY3xQD6PQ5cgqZVwKLwf65InMh+qS7g40JodDyqfv8TPw4FZLpebY2Bb8bE6MtXRn3Gnemj5cdhW/3EdefUuM7+KVYZjLlt23vFwGk6H8Z9Lnh5ryf9fAo4Z71PwE0/BU6cZcziRG8v01Dfxymmb8RQwh/YKga+i1Ydf05/mX02Pt9liMn7D/1jG9m7qt+y10TAcXgGzTe3QrMfYVxv4aEY+dQQym03eP5juI/Z+HTeZvznFt9knyD/2X8b2Pyf43fIr/fN/7L+GHTV5P5OdGEAmkoxAIAGEajUiMiIxREYAgSmwmlXeXVYjEhOSWUYgSaZEkgnrYznxAtNKQWK4RMbAdIlMcDGr57WwLFJE7JJ6MhlcNBkAyilHuevSmix1pSpJjWuVtHT51se1YHa4CAkuhllGeegqcOWuRDX68lPFqMZR4zP2vGc3lSjV3FVZ1ZhclUxw1fqCbZJRPmm4wNVVQDmqPGpWgysjWjG5zaJp9ikvbNOO3TWiqAGmEZQDrtGMcJFySO417Ni5S0Z1+eUCl5TWYt6qhqa4dhSWBg6XxyCnWvcdW8owOWDyK1tazLWwJY07tstllFQvF7hGNVDdvaKpddlN75vNJ7mckrhjT+oxqwHDpnclI9qVjSzt2JpMRrWudIGLroFyAFHdm+ZRLfvdfru1lX3dwut+mzxIlq/bttjcBgkL2ybN1GyzRpOKS9FklFfNAS5GyeQAqkagK8+SeryxJc1FTik9sMMsK2sjcbO5pIqbzQvvmgUaLwv70jQiMSAxMa0Ri8QQaDls8U2mJb4TwH18RybEUtMaxktgr5kigSTDGvok5bv45u9Mpz7s89p/U2K/e/R3nlkAAAAASUVORK5CYII=",
          //     question: "Who will win the 2022 Men's T20 Cricket World Cup?",
          //     status: "Proposed",
          //     categories: [...demoCategories],
          //     prediction: demoCategories[2].ticker,
          //     volume: 456032,
          //   },
          //   {
          //     marketId: 1,
          //     img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAABACAMAAAANpPgjAAAANlBMVEXkLyb////kLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLyYif3JYAAAAEXRSTlMAABAgMEBQYHCAj5+vv8/f7/4ucL8AAAQdSURBVFjD7ZhRt6MqDIV3gQ1EDbL//5+9D9pae9tTe8Yz8zCTF11L5CMhCSTAdyQVm9wBAONkVnj818smH2NjGZoWAQCs720s8WfZeZi1yT1bklqNP8XOY9dOHtmSWg3ns6PNepQnbEkjz2WHYTd9d6tkXlVkMd99dp7IzjtjewZ8lrQhyFSnu0HlNHbYoYebpe/YkhvvHIKn6V3v2XzCRpckB8rqFeN5++2SxuwPHsb9ADkA1C5J83ns2KcI8CU7bLuBYRt1TozFdVdfsIskKW+v/ey89pIdNjuXd45+Mju0G6+cHWOv2C0CSNfI8tuIr9BnsfeZPACY36J/hM3bgIbfzW4JiPozequnNcVcA/1H2X3IzJW13eCpv0upv84Oe9uOK5w3+PBzbD7kNbudnXE1QjiPPfBL9jWnqADT14fox+wsOb9io6zGTvRz2Wu+Lmnor9hIXZrteqs77ywZr2FkMU8bO+/rhalaf39p+pS9zalWE4A0S5Lta4a2hXo+855q91e2NlpmLnZVLnKrVSTJwoHcEqyjj+kQvfz/fu7u7u0xvY3xQD6PQ5cgqZVwKLwf65InMh+qS7g40JodDyqfv8TPw4FZLpebY2Bb8bE6MtXRn3Gnemj5cdhW/3EdefUuM7+KVYZjLlt23vFwGk6H8Z9Lnh5ryf9fAo4Z71PwE0/BU6cZcziRG8v01Dfxymmb8RQwh/YKga+i1Ydf05/mX02Pt9liMn7D/1jG9m7qt+y10TAcXgGzTe3QrMfYVxv4aEY+dQQym03eP5juI/Z+HTeZvznFt9knyD/2X8b2Pyf43fIr/fN/7L+GHTV5P5OdGEAmkoxAIAGEajUiMiIxREYAgSmwmlXeXVYjEhOSWUYgSaZEkgnrYznxAtNKQWK4RMbAdIlMcDGr57WwLFJE7JJ6MhlcNBkAyilHuevSmix1pSpJjWuVtHT51se1YHa4CAkuhllGeegqcOWuRDX68lPFqMZR4zP2vGc3lSjV3FVZ1ZhclUxw1fqCbZJRPmm4wNVVQDmqPGpWgysjWjG5zaJp9ikvbNOO3TWiqAGmEZQDrtGMcJFySO417Ni5S0Z1+eUCl5TWYt6qhqa4dhSWBg6XxyCnWvcdW8owOWDyK1tazLWwJY07tstllFQvF7hGNVDdvaKpddlN75vNJ7mckrhjT+oxqwHDpnclI9qVjSzt2JpMRrWudIGLroFyAFHdm+ZRLfvdfru1lX3dwut+mzxIlq/bttjcBgkL2ybN1GyzRpOKS9FklFfNAS5GyeQAqkagK8+SeryxJc1FTik9sMMsK2sjcbO5pIqbzQvvmgUaLwv70jQiMSAxMa0Ri8QQaDls8U2mJb4TwH18RybEUtMaxktgr5kigSTDGvok5bv45u9Mpz7s89p/U2K/e/R3nlkAAAAASUVORK5CYII=",
          //     question: "Who will win the 2022 Men's T20 Cricket World Cup?",
          //     status: "Proposed",
          //     categories: [...demoCategories],
          //     prediction: demoCategories[2].ticker,
          //     volume: 456032,
          //   },
          // ]}
        />
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
