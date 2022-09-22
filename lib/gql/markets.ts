import { gql, GraphQLClient } from "graphql-request";

const marketIdsQuery = gql`
  query MarketIds {
    markets {
      marketId
    }
  }
`;
const marketsQuery = gql`
  query MarketIds {
    markets {
      marketId
    }
  }
`;

export const getMarketIds = async (
  client: GraphQLClient,
): Promise<number[]> => {
  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(marketIdsQuery);

  return response.markets.map((m) => m.marketId);
};

export const getMarkets = async (client: GraphQLClient): Promise<number[]> => {
  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(marketsQuery);

  return response.markets.map((m) => m.marketId);
};
