import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";

import {
  FullMarketFragment,
  InputMaybe,
  MarketWhereInput,
  Exact,
  MarketOrderByInput,
} from "@zeitgeistpm/indexer";
import { RequestDocument } from "graphql-request";

export const marketSearchKey = "market-search";

export const useMarketSearch = (searchTerm: string) => {
  const [sdk, id] = useSdkv2();

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const enabled =
    isIndexedSdk(sdk) && debouncedSearchTerm && debouncedSearchTerm.length > 1;

  const query = useQuery(
    [id, marketSearchKey, debouncedSearchTerm],
    async () => {
      if (enabled) {
        // const searchWords = debouncedSearchTerm.split(" ");
        console.time("a");
        const { markets } = await sdk.indexer.markets({
          where: {
            OR: [
              { question_containsInsensitive: debouncedSearchTerm },
              { description_containsInsensitive: debouncedSearchTerm },
              //   { tags_containsAny: [debouncedSearchTerm] },
            ],
          },
          order: MarketOrderByInput.IdDesc,
          limit: 100,
        });
        console.timeEnd("a");

        console.log(markets);
        console.log(markets.map((m) => m.question));

        const options = {
          includeScore: true,
          // Search in `author` and in `tags` array
          keys: ["question", "description"],
          threshold: 0.9,
        };

        const fuse = new Fuse(markets, options);

        const result = fuse.search(debouncedSearchTerm);
        console.log(result);

        console.log(result.map((m) => m.item.question));
        console.log(result.map((m) => m.score));

        return markets;
      }
    },
    {
      enabled: Boolean(enabled),
      staleTime: 10_000,
    },
  );

  return query;
};

// const;
