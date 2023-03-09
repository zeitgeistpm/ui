import { gql, GraphQLClient } from "graphql-request";

const query = gql`
  query MarketStats($ids: [String!]!) {
    marketStats(ids: $ids) {
      participants
      liquidity
      marketId
    }
  }
`;

export type MarketStats = {
  participants: number;
  liquidity: string;
  marketId: number;
};

export const getMarketsStats = async (
  client: GraphQLClient,
  ids: string[] | number[],
): Promise<MarketStats[]> => {
  if (ids.length === 0) return [];
  ids = ids.map((id: string | number) => `${id}`);
  const response = await client.request<{
    marketStats: MarketStats[];
  }>(query, { ids });
  return response.marketStats;
};
