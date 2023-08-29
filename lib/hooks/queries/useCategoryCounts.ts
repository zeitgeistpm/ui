import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { CATEGORIES } from "components/front-page/PopularCategories";
import { getCategoryCounts } from "lib/gql/popular-categories";
import { useSdkv2 } from "../useSdkv2";

export const categoryCountsKey = "category-counts";

export const useCategoryCounts = () => {
  const [sdk] = useSdkv2();

  const query = useQuery(
    [categoryCountsKey],
    async () => {
      if (isIndexedSdk(sdk)) {
        const categoryCounts = await getCategoryCounts(
          sdk.indexer.client,
          CATEGORIES.map((c) => c.name),
        );

        return categoryCounts;
      }
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk)),
      keepPreviousData: true,
    },
  );

  return query;
};
