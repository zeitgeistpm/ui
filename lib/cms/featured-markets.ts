import groq from "groq";
import { sanity } from "./sanity";

export type CmsFeaturedMarkets = {
  marketIds: number[];
};

const fields = groq`{
  "marketIds": markets[].marketId,
}`;

export const getCmsFeaturedMarkets = async () => {
  // Short circuit to use default if NOTION_API_KEY doesn't exist.
  const data = await sanity.fetch<CmsFeaturedMarkets[]>(
    groq`*[_type == "featuredMarkets"]${fields}`,
  );

  return data?.[0];
};
