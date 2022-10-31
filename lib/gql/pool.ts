import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { ZTG } from "lib/constants";
import { JSONObject } from "lib/types";

const baseAssetQuery = gql`
  query BaseAsset($poolId: Int) {
    pools(where: { poolId_eq: $poolId }) {
      baseAsset
    }
  }
`;

export const getBaseAsset = async (client: GraphQLClient, poolId: number) => {
  const response = await client.request<{
    pools: {
      baseAsset: string;
    }[];
  }>(baseAssetQuery, { poolId });

  return response.pools[0]?.baseAsset;
};

const assetsQuery = gql`
  query Asset($poolId: Int) {
    assets(where: { poolId_eq: $poolId }) {
      price
      assetId
      amountInPool
    }
  }
`;

export type PoolAsset = {
  price: number;
  assetId: string;
  amountInPool: Decimal;
};

export const getPoolAssets = async (
  client: GraphQLClient,
  poolId: number,
): Promise<PoolAsset[]> => {
  const response = await client.request<{
    assets: {
      price: number;
      assetId: string;
      amountInPool: string;
    }[];
  }>(assetsQuery, { poolId });

  const assetsRaw = response.assets;

  return assetsRaw.map((asset) => ({
    price: asset.price,
    assetId: asset.assetId,
    amountInPool: new Decimal(asset.amountInPool).div(ZTG),
  }));
};
