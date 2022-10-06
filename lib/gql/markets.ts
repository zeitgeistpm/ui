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
const marketQuery = gql`
  query Market($marketId: Int) {
    markets(where: { marketId_eq: $marketId }) {
      marketId
      outcomeAssets
      slug
      question
      img
      marketType {
        categorical
        scalar
      }
      categories {
        ticker
      }
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

export const getMarket = async (client: GraphQLClient, marketId: string) => {
  const response = await client.request<{
    markets: {
      marketId: number;
      img: string;
      slug: string;
      marketType: { [key: string]: string };
      categories: { ticker: string }[];
    }[];
  }>(marketQuery, {
    marketId: Number(marketId),
  });

  return response.markets[0];
};
