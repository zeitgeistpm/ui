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

// Query for getting assets by combinatorial tokens that don't have markets
export const assetsWithNullMarketsQuery = gql`
  query AssetsWithNullMarkets($assetIds: [String!]!) {
    assets(where: {
      assetId_in: $assetIds,
      market_isNull: true
    }) {
      marketIds
      assetId
      poolId
    }
  }
`;

// Query for getting pool asset IDs for proper ordering
// We query Assets by poolId to get the assets in order
export const poolsAssetIdsQuery = gql`
  query PoolsAssetIds($poolIds: [Int!]!) {
    assets(where: {
      poolId_in: $poolIds
    }, orderBy: id_ASC) {
      poolId
      assetId
    }
  }
`;

// Query for getting neoPool parentCollectionIds by poolId
export const neoPoolParentCollectionIdsQuery = gql`
  query NeoPoolParentCollectionIds($poolId: Int!) {
    neoPools(where: { poolId_eq: $poolId }, limit: 1) {
      parentCollectionIds
    }
  }
`;

// Query for getting liquidity shares managers by account
export const liquiditySharesManagersQuery = gql`
  query LiquiditySharesManagers($account: String!) {
    liquiditySharesManagers(where: { account_eq: $account }) {
      stake
      id
      fees
      account
      neoPool {
        volume
        totalStake
        swapFee
        poolId
        parentCollectionIds
        marketIds
        marketId
        liquidityParameter
        isMultiMarket
        id
        createdAt
        collateral
        account {
          accountId
          balances {
            assetId
            balance
          }
        }
      }
    }
  }
`;

export interface LiquiditySharesManagerData {
  stake: string;
  id: string;
  fees: string;
  account: string;
  neoPool: {
    volume: string;
    totalStake: string;
    swapFee: string;
    poolId: number;
    parentCollectionIds: string[] | null;
    marketIds: number[];
    marketId: number | null;
    liquidityParameter: string;
    isMultiMarket: boolean;
    id: string;
    createdAt: string;
    collateral: string;
    account: {
      accountId: string;
      balances: Array<{
        assetId: string;
        balance: string;
      }>;
    };
  };
}

export const getLiquiditySharesManagers = async (
  client: GraphQLClient,
  account: string
): Promise<LiquiditySharesManagerData[]> => {
  try {
    const response = await client.request<{
      liquiditySharesManagers: LiquiditySharesManagerData[];
    }>(liquiditySharesManagersQuery, {
      account,
    });

    return response.liquiditySharesManagers || [];
  } catch (error) {
    console.error("Error fetching liquidity shares managers:", error);
    throw error;
  }
};

// Query for getting multi-market pools created by a specific account
export const createdMultiMarketPoolsQuery = gql`
  query CreatedMultiMarketPools($accountId: String!) {
    neoPools(
      where: { 
        account: { accountId_eq: $accountId }
        isMultiMarket_eq: true
      }
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
      isMultiMarket
      volume
      id
      account {
        accountId
      }
    }
  }
`;

export interface CreatedMultiMarketPool {
  poolId: number;
  marketIds: number[];
  marketId: number | null;
  totalStake: string;
  swapFee: string;
  liquidityParameter: string;
  collateral: string;
  createdAt: string;
  isMultiMarket: boolean;
  volume: string;
  id: string;
  account: {
    accountId: string;
  };
}

export const getCreatedMultiMarketPools = async (
  client: GraphQLClient,
  accountId: string
): Promise<CreatedMultiMarketPool[]> => {
  try {
    const response = await client.request<{
      neoPools: CreatedMultiMarketPool[];
    }>(createdMultiMarketPoolsQuery, {
      accountId,
    });

    return response.neoPools || [];
  } catch (error) {
    console.error("Error fetching created multi-market pools:", error);
    throw error;
  }
};

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

export type AssetWithNullMarket = {
  marketIds: number[];
  assetId: string;
  poolId: number | null;
};

export type PoolAssetId = {
  poolId: number;
  assetId: string; // JSON string containing the asset ID
};

export type NeoPoolParentCollectionIds = {
  parentCollectionIds: string[];
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

export const getMultiMarketAssets = async (
  client: GraphQLClient,
  multiMarketAssets: string[],
): Promise<AssetWithNullMarket[]> => {
  if (multiMarketAssets.length === 0) return [];

  // Convert formatted strings to the JSON format expected by the query
  // Input: ["combinatorialToken":"0x123"]
  // Output: ["{\"combinatorialToken\":\"0x123\"}"]
  const assetIds = multiMarketAssets.map(token => {
    // Token comes as: "combinatorialToken":"0x123"
    // We need: {"combinatorialToken":"0x123"}
    return `{${token}}`;
  });


  try {
    const response = await client.request<{
      assets: AssetWithNullMarket[];
    }>(assetsWithNullMarketsQuery, {
      assetIds,
    });

    return response.assets || [];
  } catch (error) {
    throw error;
  }
};

export const getPoolsAssetIds = async (
  client: GraphQLClient,
  poolIds: number[],
): Promise<Map<number, any[]>> => {
  if (poolIds.length === 0) return new Map();

  try {
    const response = await client.request<{
      assets: PoolAssetId[];
    }>(poolsAssetIdsQuery, {
      poolIds,
    });
    // Group assets by poolId and parse the assetId JSON strings
    const poolAssetMap = new Map<number, any[]>();

    response.assets?.forEach(asset => {
      if (!poolAssetMap.has(asset.poolId)) {
        poolAssetMap.set(asset.poolId, []);
      }

      // Parse the assetId JSON string to get the actual asset object
      try {
        const assetObj = JSON.parse(asset.assetId);
        poolAssetMap.get(asset.poolId)?.push(assetObj);
      } catch (e) {
        console.error("Failed to parse assetId:", asset.assetId);
      }
    });

    return poolAssetMap;
  } catch (error) {
    console.error("Error fetching pool asset IDs:", error);
    throw error;
  }
};

export const getNeoPoolParentCollectionIds = async (
  client: GraphQLClient,
  poolId: number,
): Promise<string[] | null> => {
  try {
    const response = await client.request<{
      neoPools: NeoPoolParentCollectionIds[];
    }>(neoPoolParentCollectionIdsQuery, {
      poolId,
    });
    return response.neoPools?.[0]?.parentCollectionIds ?? null;
  } catch (error) {
    console.error("Error fetching neoPool parentCollectionIds:", error);
    throw error;
  }
};