import { GraphQLClient } from "graphql-request";
import { hiddenMarketIds } from "lib/constants/markets";
import { marketMetaFilter } from "./constants";

export const getCategoryCounts = async (
  client: GraphQLClient,
  categoryNames: string[],
): Promise<number[]> => {
  const queries = categoryNames.map(
    (name, index) => `tag${index}: marketsConnection(where: {
      status_eq: Active, 
      tags_containsAny: "${name}", 
      marketId_not_in: ${hiddenMarketIds},
      ${marketMetaFilter}
    }, orderBy: marketId_ASC) {
      totalCount
    }`,
  );

  const response = await client.request<{
    [key: string]: {
      totalCount: number;
    };
  }>(`query CategoryCounts {${queries.join(" ")}}`);

  const counts = Object.values(response).map((a) => a.totalCount);

  return counts;
};
