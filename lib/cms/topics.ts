import type { PortableTextBlock } from "@portabletext/types";
import { SanityImageObject } from "@sanity/image-url/lib/types/types";
import { ZeitgeistIndexer } from "@zeitgeistpm/indexer";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import groq from "groq";
import { getMarketsStats } from "lib/gql/markets-stats";
import { sanity } from "./sanity";

export type CmsTopicHeader = {
  title: string;
  slug: string;
  thumbnail: string;
  marketIds: number[];
};

export type CmsTopicFull = {
  title: string;
  description: PortableTextBlock[];
  slug: string;
  thumbnail: string;
  banner: SanityImageObject;
  bannerBlurData: string;
  marketIds: number[];
};

const topicHeaderFields = groq`{
  title,
  "slug": slug.current,
  "thumbnail": thumbnail.asset->url,
  "marketIds": markets[].marketId,
}`;

export const getCmsTopicHeaders = async (): Promise<CmsTopicHeader[]> => {
  const data = await sanity.fetch<CmsTopicHeader[]>(
    groq`*[_type == "topic"] | order(orderRank) ${topicHeaderFields}`,
  );

  return data;
};

const topicFullFields = groq`{
  title,
  description,
  "slug": slug.current,
  "thumbnail": thumbnail.asset->url,
  "banner": banner,
  "bannerBlurData": banner.asset->metadata.lqip,
  "marketIds": markets[].marketId
}`;

export const getCmsFullTopic = async (slug: string): Promise<CmsTopicFull> => {
  const data = await sanity.fetch<CmsTopicFull[]>(
    groq`*[_type == "topic" && slug.current == "${slug}"] | order(orderRank) ${topicFullFields}`,
  );

  return data[0];
};

export const marketsForTopic = async (
  topic: CmsTopicFull | CmsTopicHeader,
  indexer: ZeitgeistIndexer,
  opts?: {
    limit?: number;
  },
) => {
  const { markets } = await indexer.markets({
    where: {
      marketId_in: topic.marketIds,
    },
    limit: opts?.limit,
  });

  const stats = await getMarketsStats(
    indexer.client,
    markets.map((m) => m.marketId),
  );

  const marketCardsData = markets
    .map((market) => {
      if (!market || !market.assets) return;

      return {
        market,
        stats: stats.find((s) => s.marketId === market.marketId),
      };
    })
    .filter(isNotNull);

  marketCardsData.sort((a, b) => {
    return (
      topic.marketIds?.findIndex((m) => m === a.market.marketId) -
      topic.marketIds?.findIndex((m) => m === b.market.marketId)
    );
  });

  return marketCardsData;
};
