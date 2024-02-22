import type { PortableTextBlock } from "@portabletext/types";
import groq from "groq";
import { sanity } from "./sanity";

export type FullCmsMarketMetadata = {
  marketId?: number | null;
  question?: string;
  description?: PortableTextBlock[];
  imageUrl?: string | null;
  referendumRef?: {
    chain?: "polkadot" | "kusama";
    referendumIndex?: number;
  };
};
export type CmsMarketCardMetadata = {
  marketId?: number | null;
  question?: string;
  imageUrl?: string | null;
};

const fullFields = groq`{
  "marketId": market.marketId,
  question,
  description,
  "imageUrl": img.asset->url,
  referendumRef,
}`;

const cardFields = groq`{
  "marketId": market.marketId,
  question,
  "imageUrl": img.asset->url,
}`;

export const getCmsFullMarketMetadataForMarket = async (
  marketId: number,
): Promise<FullCmsMarketMetadata | null> => {
  const data = await sanity.fetch<FullCmsMarketMetadata>(
    groq`*[_type == "marketMetadata" && market.marketId == ${marketId}]${fullFields}`,
  );

  return data?.[0];
};

export const getCmsFullMarketMetadataForMarkets = async (
  marketIds: number[],
): Promise<FullCmsMarketMetadata[]> => {
  const data = await sanity.fetch<FullCmsMarketMetadata[]>(
    groq`*[_type == "marketMetadata" && market.marketId in ${JSON.stringify(
      marketIds,
    )}]${fullFields}`,
  );

  return data;
};

export const getCmsMarketCardMetadataForAllMarkets = async (): Promise<
  CmsMarketCardMetadata[]
> => {
  const data = await sanity.fetch<FullCmsMarketMetadata[]>(
    groq`*[_type == "marketMetadata"]${cardFields}`,
  );

  return data;
};
