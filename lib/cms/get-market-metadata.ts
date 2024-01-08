import { Client } from "@notionhq/client";
import groq from "groq";
import { sanity } from "./sanity";
import type { PortableTextBlock } from "@portabletext/types";

export type CmsMarketMetadata = {
  marketId?: number | null;
  question?: string;
  description?: PortableTextBlock[];
  imageUrl?: string | null;
  referendumRef?: {
    chain?: "polkadot" | "kusama";
    referendumIndex?: number;
  };
};

const fields = groq`{
  "marketId": market.marketId,
  question,
  description,
  "imageUrl": img.asset->url,
  referendumRef,
}`;

export const getCmsMarketMetadataForMarket = async (
  marketId: number,
): Promise<CmsMarketMetadata | null> => {
  const data = await sanity.fetch<CmsMarketMetadata>(
    groq`*[_type == "marketMetadata" && market.marketId == ${marketId}]${fields}`,
  );

  return data?.[0];
};

export const getCmsMarketMetadataForMarkets = async (
  marketIds: number[],
): Promise<CmsMarketMetadata[]> => {
  const data = await sanity.fetch<CmsMarketMetadata[]>(
    groq`*[_type == "marketMetadata" && market.marketId in ${JSON.stringify(
      marketIds,
    )}]${fields}`,
  );

  return data;
};

export const getCmsMarketMetadataForAllMarkets = async (): Promise<
  CmsMarketMetadata[]
> => {
  const data = await sanity.fetch<CmsMarketMetadata[]>(
    groq`*[_type == "marketMetadata"]${fields}`,
  );

  return data;
};
