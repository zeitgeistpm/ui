import { gql, GraphQLClient } from "graphql-request";

const tagsQuery = gql`
  query MarketTags($tag: [String!]) {
    markets(where: { tags_containsAny: $tag, status_eq: Active }) {
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
