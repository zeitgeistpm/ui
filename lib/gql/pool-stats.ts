import { gql, GraphQLClient } from "graphql-request";

const query = gql`
  query PoolStats($ids: [Int!]!) {
    poolStats(poolId: $ids) {
      participants
      liquidity
      poolId
      traders
      volume
    }
  }
`;

export type PoolStats = {
  participants: number;
  liquidity: string;
  traders: number;
  volume: string;
  poolId: number;
};

export const getPoolStats = async (
  client: GraphQLClient,
  ids: number[],
): Promise<PoolStats[]> => {
  if (ids.length === 0) return [];
  const { poolStats } = await client.request<{
    poolStats: PoolStats[];
  }>(query, { ids });
  return poolStats;
};