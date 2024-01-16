import { CATEGORY_IMAGES } from "lib/constants/category-images";
import { useMarketCmsMetadata } from "./queries/cms/useMarketCmsMetadata";
import { FullMarketFragment } from "@zeitgeistpm/indexer";

export const useMarketImage = (
  market: FullMarketFragment | { marketId: number; tags?: string[] },
  opts?: {
    fallback?: string;
  },
) => {
  const tagIndex = market.tags ? market.marketId % market.tags.length : 0;
  const pickedTag = market.tags?.[tagIndex];

  const tag = (
    pickedTag && pickedTag in CATEGORY_IMAGES ? pickedTag : "untagged"
  ) as keyof typeof CATEGORY_IMAGES;

  const category = CATEGORY_IMAGES[tag];

  const fallback = category[market.marketId % category.length];

  const cmsQuery = useMarketCmsMetadata(market.marketId);

  return {
    ...cmsQuery,
    data: cmsQuery.data?.imageUrl ?? opts?.fallback ?? fallback,
  };
};
