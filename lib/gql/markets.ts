import { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { gql, GraphQLClient } from "graphql-request";
import { MarketStatus } from "lib/types";

const marketStatusIdsQuery = gql`
  query MarketIds {
    markets {
      marketId
      status
    }
  }
`;

const marketQuery = gql`
  query Market($marketId: Int) {
    markets(where: { marketId_eq: $marketId }) {
      marketId
      description
      poolId
      question
      slug
      status
      img
      outcomeAssets
      poolId
      scalarType
      period {
        start
        end
      }
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
  period: {
    start: string;
    end: string;
  };
  categories: { ticker: string; color: string }[];
  outcomeAssets: string[];
  poolId: number;
  scalarType: ScalarRangeType | null;
}

export const getMarketStatusIds = async (client: GraphQLClient) => {
  const response = await client.request<{
    markets: {
      marketId: number;
      status: MarketStatus;
    }[];
  }>(marketStatusIdsQuery);

  return response.markets;
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
  return response.markets.length > 0;
};
