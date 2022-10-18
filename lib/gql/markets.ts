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
      end
      description
      poolId
      question
      slug
      status
      img
      outcomeAssets
      poolId
      categories {
        ticker
        color
      }
    }
  }
`;

export interface MarketPageIndexedData {
  marketId: number;
  img: string;
  slug: string;
  question: string;
  description: string;
  status: string;
  end: number;
  categories: { ticker: string; color: string }[];
  outcomeAssets: string[];
  poolId: number;
}

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
    markets: MarketPageIndexedData[];
  }>(marketQuery, {
    marketId: Number(marketId),
  });

  return response.markets[0];
};

export const checkMarketExists = async (
  client: GraphQLClient,
  marketId: number,
): Promise<boolean> => {
  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(
    gql`
      query Market($marketId: Int) {
        markets(where: { marketId_eq: $marketId }) {
          marketId
        }
      }
    `,
    {
      marketId: marketId,
    },
  );
  console.log(response);
  return response.markets.length > 0;
};
