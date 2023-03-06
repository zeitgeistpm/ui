import { Client, isFullPage } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type Banner = {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  buttonColor: string;
};

export const getBanners = async (): Promise<Banner[]> => {
  const { results: bannersData } = await notion.databases.query({
    database_id: "7085702a851842adace1c9963e817446",
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

  return bannersData.filter(isFullPage).map((page) => {
    let title: string;
    let subtitle: string | null;
    let imageUrl: string;
    let ctaText: string;
    let ctaLink: string;
    let buttonColor: string;

    if (page.properties.Title.type === "title") {
      title = page.properties.Title.title[0].plain_text;
    }

    if (page.properties.Subtitle.type === "rich_text") {
      subtitle = page.properties.Subtitle.rich_text?.[0]?.plain_text ?? null;
    }

    if (page.properties.Image.type === "url") {
      imageUrl = page.properties.Image.url;
    }

    if (page.properties["CTA(button text)"].type === "rich_text") {
      ctaText = page.properties["CTA(button text)"].rich_text[0].plain_text;
    }

    if (page.properties["CTA(link)"].type === "url") {
      ctaLink = page.properties["CTA(link)"].url;
    }

    if (page.properties["Button Color"].type === "select") {
      buttonColor = getColorPreset(page.properties["Button Color"].select.name);
    }

    return {
      title,
      subtitle,
      imageUrl,
      ctaText,
      ctaLink,
      buttonColor,
    };
  });
};

const getColorPreset = (color: string) => {
  if (color === "blue") return "rgb(54, 121, 225)";
  if (color === "red") return "rgb(233, 3, 3)";
  if (color === "purple") return "rgb(173, 71, 196)";
  return "rgb(54, 121, 225)";
};
