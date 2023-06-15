import { gql, GraphQLClient } from "graphql-request";
import { hiddenMarketIds } from "lib/constants/markets";

const tagsQuery = gql`
  query MarketTags($tag: [String!]) {
    markets(
      where: {
        tags_containsAny: $tag
        status_eq: Active
        question_not_eq: ""
        question_isNull: false
        hasValidMetaCategories_eq: true
        marketId_not_in: ${hiddenMarketIds}
      }
    ) {
      marketId
    }
  }
`;

export const getCategoryCounts = async (
  client: GraphQLClient,
  categoryNames: string[],
): Promise<number[]> => {
  const counts = await Promise.all(
    categoryNames.map((category) => getTagCount(client, category)),
  );

  return counts;
};

const getTagCount = async (client: GraphQLClient, tag: string) => {
  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(tagsQuery, { tag: tag });

  return response.markets.length;
};
