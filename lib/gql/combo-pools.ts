import { gql } from "graphql-request";
import { GraphQLClient } from "graphql-request";

// Query for getting combo pools - fetch all and filter client-side
const comboPoolsQuery = gql`
  query ComboPools($limit: Int, $offset: Int) {
    neoPools(
      limit: $limit
      offset: $offset
      orderBy: createdAt_DESC
    ) {
      poolId
      marketIds
      marketId
      totalStake
      swapFee
      liquidityParameter
      collateral
      createdAt
      id
      account {
        accountId
      }
    }
  }
`;

// Query for getting pool stats for combo pools
const comboPoolStatsQuery = gql`
  query ComboPoolStats($poolIds: [Int!]!) {
    poolStats(poolId: $poolIds) {
      poolId
      liquidity
      participants
      traders
      volume
    }
  }
`;

// Query for getting markets by their IDs (for combo pool associated markets)
const marketsByIdsQuery = gql`
  query MarketsByIds($marketIds: [Int!]!) {
    markets(where: { marketId_in: $marketIds }) {
      marketId
      question
      slug
      description
      status
      categories {
        name
        color
      }
      tags
      baseAsset
      creator
      oracle
      period {
        start
        end
      }
      marketType {
        scalar
        categorical
      }
      outcomeAssets
    }
  }
`;

export type ComboPoolData = {
  poolId: number;
  marketIds: number[];
  marketId: number;
  totalStake: string;
  swapFee: string;
  liquidityParameter: string;
  collateral: string;
  createdAt: string;
  id: string;
  account: {
    accountId: string;
  };
};

export type ComboPoolStatsData = {
  poolId: number;
  liquidity: string;
  participants: number;
  traders: number;
  volume: string;
};

export type MarketBasicData = {
  marketId: number;
  question: string;
  slug: string;
  description: string;
  status: string;
  categories: Array<{
    name: string;
    color: string;
  }>;
  tags: string[];
  baseAsset: string;
  creator: string;
  oracle: string;
  period: {
    start: string;
    end: string;
  };
  marketType: {
    scalar: string[] | null;
    categorical: string | null;
  };
  outcomeAssets: string[];
};

export const getComboPools = async (
  client: GraphQLClient,
  limit = 12,
  offset = 0,
): Promise<ComboPoolData[]> => {
  // Fetch more pools than needed since we'll filter client-side
  const fetchLimit = Math.max(50, limit * 3);
  
  const response = await client.request<{
    neoPools: ComboPoolData[];
  }>(comboPoolsQuery, {
    limit: fetchLimit,
    offset,
  });

  // Filter for combo pools (pools with more than 1 market ID)
  const comboPools = response.neoPools.filter(pool => 
    pool.marketIds && pool.marketIds.length > 1
  );

  // Apply pagination after filtering
  return comboPools.slice(0, limit);
};

export const getComboPoolStats = async (
  client: GraphQLClient,
  poolIds: number[],
): Promise<ComboPoolStatsData[]> => {
  if (poolIds.length === 0) return [];
  
  const response = await client.request<{
    poolStats: ComboPoolStatsData[];
  }>(comboPoolStatsQuery, {
    poolIds,
  });

  return response.poolStats;
};

export const getMarketsByIds = async (
  client: GraphQLClient,
  marketIds: number[],
): Promise<MarketBasicData[]> => {
  if (marketIds.length === 0) return [];
  
  const response = await client.request<{
    markets: MarketBasicData[];
  }>(marketsByIdsQuery, {
    marketIds,
  });

  return response.markets;
};