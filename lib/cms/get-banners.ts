import { Client, isFullPage } from "@notionhq/client";
import * as z from "zod";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type Banner = z.infer<typeof IOBanner>;

export const IOBanner = z.object({
  title: z.string(),
  subtitle: z.string(),
  imageUrl: z.string(),
  ctaText: z.string(),
  ctaLink: z.string(),
  buttonColor: z.string().optional(),
  buttonTextColor: z.string().optional(),
  imageAlignment: z.enum(["left", "right", "center"]).optional(),
});

const DEFAULT_BANNERS: Banner[] = [
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

export const getBanners = async (): Promise<Banner[]> => {
  // Short circuit to use default if NOTION_API_KEY doesn't exist.
  if (!process.env.NOTION_API_KEY) {
    return DEFAULT_BANNERS;
  }

  const contrast = (await import("font-color-contrast")).default;
  const { results: bannersData } = await notion.databases.query({
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

  const parsed = bannersData.filter(isFullPage).map((page) => {
    const banner: Partial<Banner> = {};

    if (page.properties.Title.type === "title") {
      banner.title = page.properties.Title.title[0].plain_text;
    }

    if (page.properties.Subtitle.type === "rich_text") {
      banner.subtitle = page.properties.Subtitle.rich_text?.[0]?.plain_text;
    }

    if (page.properties.Image.type === "url") {
      banner.imageUrl = page.properties.Image.url ?? undefined;
    }

    if (page.properties["CTA(button text)"].type === "rich_text") {
      banner.ctaText =
        page.properties["CTA(button text)"].rich_text[0].plain_text;
    }

    if (page.properties["CTA(link)"].type === "url") {
      banner.ctaLink = page.properties["CTA(link)"].url ?? undefined;
    }

    if (page.properties["Button Color"].type === "rich_text") {
      banner.buttonColor =
        page.properties["Button Color"].rich_text[0].plain_text;
    }

    if (page.properties["Image Align"].type === "select") {
      banner.imageAlignment =
        (page.properties["Image Align"].select
          ?.name as Banner["imageAlignment"]) ?? "left";
    }

    banner.buttonTextColor = banner.buttonColor
      ? contrast(banner.buttonColor)
      : "#000000";

    return banner;
  });

  const validBanners: Banner[] = [];

  for (const banner of parsed) {
    try {
      validBanners.push(IOBanner.parse(banner));
    } catch (e) {
      console.info("Invalid banner data: ", banner);
    }
  }

  return validBanners;
};
