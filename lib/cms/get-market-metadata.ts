import { Client, isFullPage } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type CmsMarketMetadata = {
  marketId?: number;
  imageUrl?: string;
  referendumIndex?: number;
};

export const getCmsMarketMetadataFormMarket = async (
  marketIds: number,
): Promise<CmsMarketMetadata | null> => {
  return getCmsMarketMetadataFormMarkets([marketIds]).then(
    (mm) => mm?.[0] ?? null,
  );
};

export const getCmsMarketMetadataFormMarkets = async (
  marketIds: number[],
): Promise<CmsMarketMetadata[] | null> => {
  if (!process.env.NOTION_API_KEY) {
    return null;
  }

  const { results: marketMetadata } = await notion.databases.query({
    database_id: "e725c0b99674440590d3d5d694960172",
    filter: {
      property: "Environment",
      multi_select: {
        contains: process.env.NEXT_PUBLIC_VERCEL_ENV!,
      },
      or: marketIds.map((marketId) => ({
        property: "MarketId",
        number: {
          equals: Number(marketId),
        },
      })),
    },
  });

  return marketMetadata.filter(isFullPage).map(parseMarketMetaData) ?? null;
};

export const parseMarketMetaData = (data: PageObjectResponse) => {
  const promotedMarket: CmsMarketMetadata = {};

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
