import { Client, isFullPage } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type PromotedMarket = {
  marketId?: number;
  imageUrl?: string;
  tradeRequirement?: number;
  prize?: number;
  timeSpan?: [number, number];
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
  const promotedMarket: PromotedMarket = {};

  if (data.properties.MarketId.type === "number") {
    promotedMarket.marketId = data.properties.MarketId.number ?? undefined;
  }

  if (data.properties.Image.type === "url") {
    promotedMarket.imageUrl = data.properties.Image.url ?? undefined;
  }

  if (data.properties.TradeRequirement.type === "number") {
    promotedMarket.tradeRequirement =
      data.properties.TradeRequirement.number ?? undefined;
  }

  if (data.properties.Prize.type === "number") {
    promotedMarket.prize = data.properties.Prize.number ?? undefined;
  }

  if (
    data.properties.TimeSpan.type === "date" &&
    data.properties.TimeSpan.date?.start &&
    data.properties.TimeSpan.date?.end
  ) {
    const startDate = new Date(data.properties.TimeSpan.date.start);
    const endDate = new Date(data.properties.TimeSpan.date.end);
    promotedMarket.timeSpan = [startDate.getTime(), endDate.getTime()];
  }

  return promotedMarket;
};
