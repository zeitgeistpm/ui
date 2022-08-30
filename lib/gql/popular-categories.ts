import { gql, GraphQLClient } from "graphql-request";

const tagsQuery = gql`
  query MarketTags($tag: [String!]) {
    markets(where: { tags_containsAny: $tag, status_eq: "Active" }) {
      marketId
    }
  }
`;

export interface TagCounts {
  sports: number;
  politics: number;
  governance: number;
  crypto: number;
}

export const getPopularCategories = async (
  client: GraphQLClient,
): Promise<TagCounts> => {
  const [sports, politics, governance, crypto] = await Promise.all([
    getTagCount(client, "Sports"),
    getTagCount(client, "Politics"),
    getTagCount(client, "Goverance"),
    getTagCount(client, "Crypto"),
  ]);

  return { sports, politics, governance, crypto };
};

const getTagCount = async (client: GraphQLClient, tag: string) => {
  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(tagsQuery, { tag: tag });

  return response.markets.length;
};
