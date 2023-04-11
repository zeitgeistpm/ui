import { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS } from "lib/constants";

const marketIdsQuery = gql`
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
      baseAsset
      pool {
        poolId
        createdAt
        volume
      }
      question
      slug
      status
      img
      outcomeAssets
      scalarType
      creator
      oracle
      disputeMechanism
      marketType {
        scalar
      }
      period {
        start
        end
      }
      categories {
        name
        color
      }
      tags
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
  categories: { name: string; color: string }[];
  outcomeAssets: string[];
  pool: { poolId: number; volume: string; createdAt: string };
  scalarType: ScalarRangeType;
  marketType: {
    scalar: string[];
  };
  creator: string;
  oracle: string;
  tags: [];
  disputeMechanism: "SimpleDisputes" | "Authorized" | "Court";
}

export const getRecentMarketIds = async (
  client: GraphQLClient,
): Promise<number[]> => {
  const timestampOneMonthAgo = new Date(
    new Date().getTime() - DAY_SECONDS * 31 * 1000,
  ).getTime();

  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(marketIdsQuery, {
    end: timestampOneMonthAgo,
  });

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
  return response.markets.length > 0;
};
