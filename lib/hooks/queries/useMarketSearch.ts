import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
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
        const search = buildSearch(debouncedSearchTerm);

        // const response = await sdk.indexer.client.request(`
        //   query MyQuery {
        //     markets(where: { OR: {${search}}}) {
        //       id
        //       tags
        //     }
        //   }
        // `);

        // console.log("res", response);

        const { markets } = await sdk.indexer.markets({
          where: {
            OR: search,
          },
          order: MarketOrderByInput.IdDesc,
          limit: 100,
        });
        console.timeEnd("a");

        console.log(markets);
        console.log(markets.map((m) => m.question));
        console.time("b");
        const fuse = new Fuse(markets, {
          includeScore: true,
          threshold: 0.9,
          keys: [
            //matches in the question are consisdered more important
            {
              name: "question",
              weight: 3,
            },
            {
              name: "description",
              weight: 1,
            },
            { name: "status", weight: 0.2 },
          ],
        });

        // const result = fuse.search(debouncedSearchTerm);
        const result = fuse.search({
          $or: [
            { question: debouncedSearchTerm },
            { description: debouncedSearchTerm },
            { status: "Active" },
          ],
        });
        console.timeEnd("b");
        console.log(result);

        console.log(result.map((m) => m.item.question));
        console.log(result.map((m) => m.item.status));
        console.log(result.map((m) => m.score));

        return result.map((r) => r.item);
      }
    },
    {
      enabled: Boolean(enabled),
      staleTime: 10_000,
    },
  );

  return query;
};

// const buildSearch = (searchTerm: string) => {
//   const search = searchTerm
//     .split(" ")
//     .map(
//       (word) =>
//         `description_containsInsensitive: "${word}", question_containsInsensitive: "${word}"`,
//     )
//     .join(",");
//   console.log(search);

//   return search;
// };
const buildSearch = (searchTerm: string) => {
  const search = searchTerm
    .split(" ")
    .map((word) => [
      { question_containsInsensitive: word },
      { description_containsInsensitive: word },
    ])
    .flat();

  return search;
};

// const;
