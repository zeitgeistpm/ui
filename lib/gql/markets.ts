import { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS } from "lib/constants";

const marketStatusIdsQuery = gql`
  query MarketIds($end: BigInt) {
    markets(where: { period: { end_gt: $end } }) {
      marketId
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

export const getRecentMarketIds = async (client: GraphQLClient) => {
  const timstampOneMonthAgo = new Date(
    new Date().getTime() - DAY_SECONDS * 31 * 1000,
  ).getTime();

  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(marketStatusIdsQuery, {
    end: timstampOneMonthAgo,
  });

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
