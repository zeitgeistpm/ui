import groq from "groq";
import { sanity } from "./sanity";

export type CmsNews = {
  title: string;
  subtitle: string;
  image: string;
  link:
    | { isMarket: true; market: { marketId: number } }
    | { isMarket: false | undefined; url: string };
};

const DEFAULT_NEWS: CmsNews[] = [
  {
    title: "Defaut Banner Title",
    subtitle: "Default Subtitle",
    image:
      "https://images.unsplash.com/photo-1680523127490-978b85b8bf71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2832&q=80",

    link: { isMarket: false, url: "#" },
  },
];

const fields = groq`{
  title,
  subtitle,
  "image": image.asset->url,
  link,
}`;

export const getCmsNews = async (): Promise<CmsNews[]> => {
  // Short circuit to use default if NOTION_API_KEY doesn't exist.
  if (!process.env.NOTION_API_KEY) {
    return DEFAULT_NEWS;
  }

  const data = await sanity.fetch<CmsNews[]>(
    groq`*[_type == "news"] | order(_createdAt desc) ${fields}`,
  );

  console.log(data);

  return data;
};
