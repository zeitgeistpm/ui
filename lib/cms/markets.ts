import type { PortableTextBlock } from "@portabletext/types";
import groq from "groq";
import { sanity } from "./sanity";

export type CmsMarketMetadataFull = {
  marketId?: number | null;
  question?: string;
  description?: PortableTextBlock[];
  imageUrl?: string | null;
  referendumRef?: {
    chain?: "polkadot" | "kusama";
    referendumIndex?: number;
  };
};

const fullFields = groq`{
  "marketId": market.marketId,
  question,
  description,
  "imageUrl": img.asset->url,
  referendumRef,
}`;

export type CmsMarketCardMetadata = {
  marketId?: number | null;
  question?: string;
  imageUrl?: string | null;
};

const cardFields = groq`{
  "marketId": market.marketId,
  question,
  "imageUrl": img.asset->url,
}`;

export const getCmsMarketMetadataForMarket = async (
  marketId: number,
): Promise<CmsMarketMetadataFull | null> => {
  const data = await sanity.fetch<CmsMarketMetadataFull>(
    groq`*[_type == "marketMetadata" && market.marketId == ${marketId}]${fullFields}`,
  );

  return data?.[0];
};

export const getCmsMarketMetadataForMarkets = async (
  marketIds: number[],
): Promise<CmsMarketMetadataFull[]> => {
  const data = await sanity.fetch<CmsMarketMetadataFull[]>(
    groq`*[_type == "marketMetadata" && market.marketId in ${JSON.stringify(
      marketIds,
    )}]${fullFields}`,
  );

  return data;
};

export const getCmsMarketMetadataForAllMarkets = async (): Promise<
  CmsMarketMetadataFull[]
> => {
  const data = await sanity.fetch<CmsMarketMetadataFull[]>(
    groq`*[_type == "marketMetadata"]${fullFields}`,
  );

  return data;
};

export const getCmsMarketCardMetadataForAllMarkets = async (): Promise<
  CmsMarketCardMetadata[]
> => {
  const data = await sanity.fetch<CmsMarketMetadataFull[]>(
    groq`*[_type == "marketMetadata"]${cardFields}`,
  );

  return data;
};
