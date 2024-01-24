import type { PortableTextBlock } from "@portabletext/types";
import { SanityImageObject } from "@sanity/image-url/lib/types/types";
import { ZTG } from "@zeitgeistpm/sdk";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { IndexedMarketCardData } from "components/markets/market-card";
import Decimal from "decimal.js";
import groq from "groq";
import { sanity } from "./sanity";
import { ZeitgeistIndexer } from "@zeitgeistpm/indexer";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";

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

  let marketCardsData = markets
    .map((market) => {
      if (!market || !market.categories) return;

      const marketCategories: MarketOutcomes = market.categories
        .map((category, index) => {
          const asset = market.assets[index];

          if (!asset) return;

          const marketCategory: MarketOutcome = {
            name: category.name ?? "",
            assetId: market.outcomeAssets[index],
            price: asset.price,
          };

          return marketCategory;
        })
        .filter(isNotNull);

      if (market.assets.length < 2) {
        console.log(market);
      }

      const prediction = getCurrentPrediction(market.assets, market);

      const marketCardData: IndexedMarketCardData = {
        marketId: market.marketId,
        question: market.question ?? "",
        creation: market.creation,
        img: market.img ?? "",
        prediction: prediction,
        creator: market.creator,
        volume: Number(new Decimal(market?.volume ?? 0).div(ZTG).toFixed(0)),
        baseAsset: market.baseAsset,
        outcomes: marketCategories,
        pool: market.pool ?? null,
        neoPool: market.neoPool,
        marketType: market.marketType as any,
        tags: market.tags?.filter(isNotNull),
        status: market.status,
        scalarType: (market.scalarType ?? null) as "number" | "date" | null,
        endDate: market.period.end,
      };

      return marketCardData;
    })
    .filter(isNotNull);

  marketCardsData.sort((a, b) => {
    return (
      topic.marketIds?.findIndex((m) => m === a.marketId) -
      topic.marketIds?.findIndex((m) => m === b.marketId)
    );
  });

  return marketCardsData;
};
