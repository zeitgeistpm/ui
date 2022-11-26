import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { useStore } from "lib/stores/Store";
import { useSdkv2 } from "lib/hooks/useSdkv2";

const assetsQuery = gql`
  query AssetsForPools($poolIds: [Int!]) {
    assets(where: { poolId_in: $poolIds }) {
      price
      assetId
      amountInPool
      poolId
    }
  }
`;

const rootKey = "markets-outcomes";

export const useOutcomesForMarkets = (
  markets: {
    pool: { poolId: number };
    marketId: number;
    categories: { color: string; name: string }[];
  }[],
): UseQueryResult<{
  [marketId: number]: {
    color: string;
    name: string;
    assetId: string;
    price: number;
    amountInPool: string;
  }[];
}> => {
  const store = useStore();
  const { graphQLClient } = store;
  const [_, id] = useSdkv2();
  const sortedPoolIds = markets.map((m) => m.pool.poolId).sort();

  const query = useQuery(
    [id, rootKey, sortedPoolIds],
    async () => {
      if (markets.length === 0) {
        return {};
      }
      const response = await graphQLClient.request<{
        assets: {
          price: number;
          assetId: string;
          amountInPool: string;
          poolId: number;
        }[];
      }>(assetsQuery, { poolIds: sortedPoolIds });
      const { assets } = response;
      return assets.reduce((prev, asset) => {
        const market = markets.find((m) => m.pool.poolId === asset.poolId);
        const { categories, marketId } = market;
        const assetIdJson = JSON.parse(asset.assetId);
        const categoryIndex = assetIdJson["categoricalOutcome"][1];
        const category = categories[categoryIndex];
        const prevPoolAssets = prev[marketId];
        const currentPoolAsset = {
          ...category,
          price: asset.price,
          assetId: asset.assetId,
          amountInPool: asset.amountInPool,
        };
        const poolAssets =
          prevPoolAssets == null
            ? [currentPoolAsset]
            : [...prevPoolAssets, currentPoolAsset];
        return {
          ...prev,
          [marketId]: poolAssets,
        };
      }, {});
    },
    {
      enabled: Boolean(graphQLClient) && sortedPoolIds.length > 0,
    },
  );

  return query;
};
