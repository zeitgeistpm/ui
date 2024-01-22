import groq from "groq";
import type { PortableTextBlock } from "@portabletext/types";
import { sanity } from "./sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

export type CmsTopicHeader = {
  title: string;
  slug: string;
  thumbnail: string;
  marketIds: number[];
};

export type CmsTopicFullTopic = {
  title: string;
  description: PortableTextBlock[];
  slug: string;
  thumbnail: string;
  banner: SanityImageSource;
  marketIds: number[];
};

const topicHeaderFields = groq`{
  title,
  "slug": slug.current,
  "thumbnail": thumbnail.asset->url,
  "marketIds": markets[].marketId,
}`;

export const getCmsTopicHeaders = async (): Promise<CmsTopicHeader[]> => {
  const data = await sanity.fetch<CmsTopicHeader[]>(
    groq`*[_type == "topic"] | order(_createdAt desc) ${topicHeaderFields}`,
  );

  return data;
};

const topicFullFields = groq`{
  title,
  description,
  "slug": slug.current,
  "thumbnail": thumbnail.asset->url,
  "banner": banner,
  "marketIds": markets[].marketId
}`;

export const getCmsFullTopic = async (
  slug: string,
): Promise<CmsTopicFullTopic> => {
  const data = await sanity.fetch<CmsTopicFullTopic[]>(
    groq`*[_type == "topic" && slug.current == "${slug}"] ${topicFullFields}`,
  );

  return data[0];
};
