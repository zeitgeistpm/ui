import { PortableText, toPlainText } from "@portabletext/react";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ZeitgeistIpfs, create } from "@zeitgeistpm/sdk";
import MarketCard from "components/markets/market-card";
import { OgHead } from "components/meta/OgHead";
import { sanityImageBuilder } from "lib/cms/sanity";
import {
  CmsTopicFull,
  getCmsFullTopic,
  getCmsTopicHeaders,
  marketsForTopic,
} from "lib/cms/topics";
import { endpointOptions, graphQlEndpoint, environment } from "lib/constants";
import { MarketStats } from "lib/gql/markets-stats";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import NotFoundPage from "pages/404";

export async function getStaticPaths() {
  const cmsTopics = await getCmsTopicHeaders();

  const paths = cmsTopics.map((topic) => ({
    params: { topic: topic.slug },
  }));

  return { paths, fallback: "blocking" };
}

export async function getStaticProps({
  params,
}: {
  params: { topic: string };
}) {
  const sdk = await create({
    provider: endpointOptions.map((e) => e.value),
    indexer: graphQlEndpoint,
    storage: ZeitgeistIpfs(),
  });

  const cmsTopic = await getCmsFullTopic(params.topic);
  const marketCardsData = await marketsForTopic(cmsTopic, sdk.indexer);

  return {
    props: {
      cmsTopic: cmsTopic ?? null,
      markets: marketCardsData,
    },
    revalidate:
      environment === "production"
        ? 5 * 60 //5min
        : 60 * 60,
  };
}

const TopicPage: NextPage<{
  cmsTopic: CmsTopicFull;
  markets: { market: FullMarketFragment; stats: MarketStats }[];
}> = ({ cmsTopic, markets }) => {
  if (process.env.NEXT_PUBLIC_SHOW_TOPICS !== "true") {
    return <NotFoundPage />;
  }

  const [marketOne, marketTwo, marketThree, marketFour, ...restMarkets] =
    markets;

  const banner = cmsTopic.banner
    ? sanityImageBuilder.image(cmsTopic.banner)
    : undefined;

  let blur = {};

  if (cmsTopic.banner && cmsTopic.bannerBlurData) {
    blur = {
      placeholder: "blur",
      blurDataURL: cmsTopic.bannerBlurData,
    };
  }

  return (
    <div>
      <OgHead
        title={cmsTopic.title}
        description={toPlainText(cmsTopic.description)}
      />
      {banner && (
        <div className="relative mb-10 mt-3 h-[150px] w-full md:h-[262px]">
          <Image
            alt=""
            src={banner.url()}
            fill
            objectFit="cover"
            className="rounded-lg transition-all"
            objectPosition={`${(cmsTopic.banner.hotspot?.x ?? 0.5) * 100}% ${
              (cmsTopic.banner.hotspot?.y ?? 0.5) * 100
            }%`}
            {...blur}
          />
        </div>
      )}

      <div className="mb-12 flex">
        <h1 className="flex-1 text-xl">{cmsTopic.title}</h1>
        <Link href="/markets">
          <div className="rounded-lg bg-slate-200 px-2 py-1 text-sm">
            All Markets
          </div>
        </Link>
      </div>

      {cmsTopic.description && (
        <div className="mb-12 text-sm leading-6">
          <PortableText value={cmsTopic.description} />
        </div>
      )}

      {markets.length > 4 ? (
        <>
          <div className="hidden lg:block">
            <div className="mb-3 flex gap-3">
              <div className="-mr-1 flex w-2/3 flex-col gap-3">
                <MarketCard
                  key={marketOne.market.marketId}
                  market={marketOne.market}
                  liquidity={marketOne.stats.liquidity}
                  numParticipants={marketOne.stats.participants}
                />
                <MarketCard
                  key={marketTwo.market.marketId}
                  market={marketTwo.market}
                  liquidity={marketTwo.stats.liquidity}
                  numParticipants={marketTwo.stats.participants}
                />
              </div>
              <div className="flex w-1/3 flex-col gap-3 pl-1">
                <MarketCard
                  key={marketThree.market.marketId}
                  market={marketThree.market}
                  liquidity={marketThree.stats.liquidity}
                  numParticipants={marketThree.stats.participants}
                />
                <MarketCard
                  key={marketFour.market.marketId}
                  market={marketFour.market}
                  liquidity={marketFour.stats.liquidity}
                  numParticipants={marketFour.stats.participants}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {restMarkets.map(({ market, stats }) => (
                <MarketCard
                  key={market.marketId}
                  market={market}
                  liquidity={stats.liquidity}
                  numParticipants={stats.participants}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1  gap-3 md:grid-cols-3 lg:hidden">
            {markets.map(({ market, stats }) => (
              <MarketCard
                key={market.marketId}
                market={market}
                numParticipants={stats.participants}
                liquidity={stats.liquidity}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1  gap-3 md:grid-cols-3">
            {markets.map(({ market, stats }) => (
              <MarketCard
                key={market.marketId}
                market={market}
                numParticipants={stats.participants}
                liquidity={stats.liquidity}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TopicPage;
