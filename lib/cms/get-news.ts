import { Client, isFullPage } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type News = {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  imageAlignment?: "left" | "right" | "center";
};

const DEFAULT_BANNERS: News[] = [
  {
    title: "Defaut Banner Title",
    subtitle: "Default Subtitle",
    imageUrl:
      "https://images.unsplash.com/photo-1680523127490-978b85b8bf71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2832&q=80",
    ctaText: "CTA Button",
    ctaLink: "#",
    buttonColor: "red",
    buttonTextColor: "white",
    imageAlignment: "center",
  },
];

export const getNews = async (): Promise<News[]> => {
  // Short circuit to use default if NOTION_API_KEY doesn't exist.
  if (!process.env.NOTION_API_KEY) {
    return DEFAULT_BANNERS;
  }

  const contrast = (await import("font-color-contrast")).default;
  const { results: newsData } = await notion.databases.query({
    database_id: "7085702a851842adace1c9963e817446",
    sorts: [
      {
        property: "Order",
        direction: "ascending",
      },
    ],
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

  return newsData.filter(isFullPage).map((page) => {
    const news: News = {};

    if (page.properties.Title.type === "title") {
      news.title = page.properties.Title.title[0].plain_text;
    }

    if (page.properties.Subtitle.type === "rich_text") {
      news.subtitle = page.properties.Subtitle.rich_text?.[0]?.plain_text;
    }

    if (page.properties.Image.type === "url") {
      news.imageUrl = page.properties.Image.url ?? undefined;
    }

    if (page.properties["CTA(button text)"].type === "rich_text") {
      news.ctaText =
        page.properties["CTA(button text)"].rich_text[0].plain_text;
    }

    if (page.properties["CTA(link)"].type === "url") {
      news.ctaLink = page.properties["CTA(link)"].url ?? undefined;
    }

    if (page.properties["Button Color"].type === "rich_text") {
      news.buttonColor =
        page.properties["Button Color"].rich_text[0].plain_text;
    }

    if (page.properties["Image Align"].type === "select") {
      news.imageAlignment =
        (page.properties["Image Align"].select
          ?.name as News["imageAlignment"]) ?? "left";
    }

    news.buttonTextColor = news.buttonColor
      ? contrast(news.buttonColor)
      : "#000000";

    return news;
  });
};