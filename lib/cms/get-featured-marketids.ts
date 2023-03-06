import { Client, isFullPage } from "@notionhq/client";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const getFeaturedMarketIds = async () => {
  const { results: featuredMarketData } = await notion.databases.query({
    database_id: "ebcc6269f7414362997b615571d90764",
    filter: {
      property: "Environment",
      select: {
        equals:
          process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
            ? "prod"
            : "staging",
      },
    },
  });

  return featuredMarketData
    .filter(isFullPage)
    .map((page) =>
      page.properties.MarketId.type === "number"
        ? page.properties.MarketId.number
        : null,
    )
    .filter(isNotNull);
};
