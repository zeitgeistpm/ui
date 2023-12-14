import { CATEGORY_IMAGES } from "lib/constants/category-images";
import { useMarketCmsMetadata } from "./queries/cms/useMarketCmsMetadata";

export const useMarketImage = (
  market: { marketId: number; tags?: string[] },
  opts?: {
    fallback?: string;
  },
) => {
  const firstTag = market.tags?.[0];

  const tag = (
    firstTag && firstTag in CATEGORY_IMAGES ? firstTag : "untagged"
  ) as keyof typeof CATEGORY_IMAGES;

  const category = CATEGORY_IMAGES[tag];

  const fallback = category[market.marketId % category.length];

  const cmsQuery = useMarketCmsMetadata(market.marketId);

  return {
    ...cmsQuery,
    data: cmsQuery.data?.imageUrl ?? opts?.fallback ?? fallback,
  };
};
