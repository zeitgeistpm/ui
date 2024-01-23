import { PortableText } from "@portabletext/react";
import { ZTG, ZeitgeistIpfs, create } from "@zeitgeistpm/sdk";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import MarketCard, {
  IndexedMarketCardData,
} from "components/markets/market-card";
import Decimal from "decimal.js";
import { sanity, sanityImageBuilder } from "lib/cms/sanity";
import { ZeitgeistIndexer } from "@zeitgeistpm/indexer";
import {
  CmsTopicFullTopic,
  CmsTopicHeader,
  getCmsFullTopic,
  getCmsTopicHeaders,
  marketsForTopic,
} from "lib/cms/topics";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";
import { endpointOptions, graphQlEndpoint } from "lib/constants";

import { getCurrentPrediction } from "lib/util/assets";
import { NextPage } from "next";
import { useNextSanityImage } from "next-sanity-image";
import Image from "next/image";
import Link from "next/link";

export async function getStaticPaths() {
  // const client = new GraphQLClient(graphQlEndpoint);
  // const marketIds = await getRecentMarketIds(client);

  // const paths = marketIds.map((market) => ({
  //   params: { marketid: market.toString() },
  // }));

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

  const { markets } = await sdk.indexer.markets({
    where: {
      marketId_in: cmsTopic.marketIds,
    },
  });

  let marketCardsData = await marketsForTopic(cmsTopic, sdk.indexer);

  return {
    props: {
      cmsTopic: cmsTopic ?? null,
      markets: marketCardsData,
    },
  };
}

const TopicPage: NextPage<{
  cmsTopic: CmsTopicFullTopic;
  markets: IndexedMarketCardData[];
}> = ({ cmsTopic, markets }) => {
  const [marketOne, marketTwo, marketThree, marketFour, ...restMarkets] =
    markets;

  const banner = sanityImageBuilder.image(cmsTopic.banner).url() ?? "";
  console.log(cmsTopic.banner);
  return (
    <div>
      {cmsTopic.banner && (
        <div className="relative mb-10 mt-3 h-[150px] w-full md:h-[262px]">
          <Image
            alt=""
            src={banner}
            fill
            sizes="100vw"
            className="rounded-lg object-cover"
            style={{
              objectFit: "cover",
            }}
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
                <MarketCard {...marketOne} />
                <MarketCard {...marketTwo} />
              </div>
              <div className="flex w-1/3 flex-col gap-3 pl-1">
                <MarketCard {...marketThree} />
                <MarketCard {...marketFour} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {restMarkets.map((market) => (
                <MarketCard {...market} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1  gap-3 md:grid-cols-3 lg:hidden">
            {markets.map((market) => (
              <MarketCard {...market} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1  gap-3 md:grid-cols-3">
            {markets.map((market) => (
              <MarketCard {...market} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TopicPage;
