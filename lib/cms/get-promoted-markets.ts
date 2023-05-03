import { Client, isFullPage } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type PromotedMarket = {
  marketId: number;
  imageUrl: string;
  tradeRequirement: number;
  prize: number;
  timeSpan: [number, number];
};

export const getPromotedMarkets = async (): Promise<PromotedMarket[]> => {
  // Short circuit to use default if NOTION_API_KEY doesn't exist.
  if (!process.env.NOTION_API_KEY) {
    return [];
  }

  const { results: promotedMarketsData } = await notion.databases.query({
    database_id: "eb2394e2272047878350217dc03bb8eb",
    filter: {
      property: "Environment",
      multi_select: {
        contains:
          process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
            ? "prod"
            : "staging",
      },
    },
  });

  return promotedMarketsData.filter(isFullPage).map(parsePromotedMarketData);
};

export const getMarketPromotion = async (
  marketId: number,
): Promise<PromotedMarket | null> => {
  if (!process.env.NOTION_API_KEY) {
    return null;
  }

  const { results: promotedMarketsData } = await notion.databases.query({
    database_id: "eb2394e2272047878350217dc03bb8eb",
    filter: {
      property: "MarketId",
      number: {
        equals: marketId,
      },
    },
  });

  return (
    promotedMarketsData.filter(isFullPage).map(parsePromotedMarketData)[0] ??
    null
  );
};

export const parsePromotedMarketData = (data: PageObjectResponse) => {
  let marketId: number;
  let imageUrl: string;
  let tradeRequirement: number;
  let prize: number;
  let timeSpan: [number, number];

  if (data.properties.MarketId.type === "number") {
    marketId = data.properties.MarketId.number;
  }

  if (data.properties.Image.type === "url") {
    imageUrl = data.properties.Image.url;
  }

  if (data.properties.TradeRequirement.type === "number") {
    tradeRequirement = data.properties.TradeRequirement.number;
  }

  if (data.properties.Prize.type === "number") {
    prize = data.properties.Prize.number;
  }

  if (data.properties.TimeSpan.type === "date") {
    const startDate = new Date(
      data.properties.TimeSpan.date.start || undefined,
    );
    const endDate = new Date(data.properties.TimeSpan.date.end);
    timeSpan = [startDate.getTime(), endDate.getTime()];
  }

  return {
    marketId,
    imageUrl,
    tradeRequirement,
    prize,
    timeSpan,
  };
};
