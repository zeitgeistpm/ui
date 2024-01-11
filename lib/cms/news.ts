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

const fields = groq`{
  title,
  subtitle,
  "image": image.asset->url,
  link,
}`;

export const getCmsNews = async (): Promise<CmsNews[]> => {
  const data = await sanity.fetch<CmsNews[]>(
    groq`*[_type == "news"] | order(_createdAt desc) ${fields}`,
  );

  console.log(data);

  return data;
};
