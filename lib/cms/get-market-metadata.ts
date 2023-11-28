import { Client, isFullPage } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type MarketMetadata = {
  marketId?: number;
  imageUrl?: string;
  referendumIndex?: number;
};

export const getCmsMarketMetadataFormMarket = async (
  marketIds: number,
): Promise<MarketMetadata | null> => {
  return getCmsMarketMetadataFormMarkets([marketIds]).then(
    (mm) => mm?.[0] ?? null,
  );
};

export const getCmsMarketMetadataFormMarkets = async (
  marketIds: number[],
): Promise<MarketMetadata[] | null> => {
  if (!process.env.NOTION_API_KEY) {
    return null;
  }
  // https://www.notion.so/zeitgeistpm/e725c0b99674440590d3d5d694960172?v=0654e2a2164b48a1a165266cf7a4b60b&pvs=4
  const { results: marketMetadata } = await notion.databases.query({
    database_id: "e725c0b99674440590d3d5d694960172",
    filter: {
      property: "Environment",
      select: {
        equals: process.env.NEXT_PUBLIC_VERCEL_ENV!,
      },
      or: marketIds.map((marketId) => ({
        property: "MarketId",
        number: {
          equals: marketId,
        },
      })),
    },
  });

  return marketMetadata.filter(isFullPage).map(parseMarketMetaData) ?? null;
};

export const parseMarketMetaData = (data: PageObjectResponse) => {
  const promotedMarket: MarketMetadata = {};

  if (data.properties.MarketId.type === "number") {
    promotedMarket.marketId = data.properties.MarketId.number ?? undefined;
  }

  if (data.properties.Image.type === "url") {
    promotedMarket.imageUrl = data.properties.Image.url ?? undefined;
  }

  if (data.properties.ReferendumIndex.type === "number") {
    promotedMarket.referendumIndex =
      data.properties.ReferendumIndex.number ?? undefined;
  }

  return promotedMarket;
};
