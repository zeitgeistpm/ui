import { gql, GraphQLClient } from "graphql-request";
import { MarketOutcomes } from "lib/types/markets";

const assetsQuery = gql`
  query AssetsForPools($poolIds: [Int!]) {
    assets(where: { pool: { poolId_in: $poolIds } }) {
      price
      assetId
      amountInPool
      pool {
        poolId
      }
    }
  }
`;

export const getOutcomesForMarkets = async (
  client: GraphQLClient,
  markets: {
    pool?: { poolId: number };
    marketId: number;
    marketType: { categorical?: string; scalar?: string[] };
    categories?: { color?: string; name?: string; ticker?: string }[];
  }[],
): Promise<{ [marketId: number]: MarketOutcomes }> => {
  if (markets.length === 0) {
    return {};
  }
  const poolIds = markets
    .filter((m) => m.pool != null)
    .map((m) => m.pool.poolId)
    .sort();

  const response = await client.request<{
    assets: {
      price: number;
      assetId: string;
      amountInPool: string;
      pool: { poolId: number };
    }[];
  }>(assetsQuery, { poolIds });

  const { assets } = response;

  return markets.reduce((prev, market) => {
    const filteredAssets = assets.filter(
      (a) => a.pool.poolId === market.pool?.poolId,
    );

    const { marketId, categories } = market;

    const type =
      market.marketType.categorical != null ? "categorical" : "scalar";

    const prevOutcomes = prev[marketId] == null ? [] : [...prev[marketId]];

    if (filteredAssets.length === 0) {
      return {
        ...prev,
        [marketId]: [...prevOutcomes, ...categories],
      };
    }

    const res = { ...prev };

    let currentOutcomes = [];

    for (const asset of filteredAssets) {
      const assetIdJson = JSON.parse(asset.assetId);
      let categoryIndex: number;

      if (type === "categorical") {
        categoryIndex = assetIdJson["categoricalOutcome"][1];
      } else {
        categoryIndex = assetIdJson["scalarOutcome"][1] === "Long" ? 0 : 1;
      }

      const category = categories[categoryIndex];
      const currentOutcome = {
        ...category,
        price: asset.price,
        assetId: asset.assetId,
        amountInPool: asset.amountInPool,
      };

      currentOutcomes = [...currentOutcomes, currentOutcome];
    }
    res[marketId] = [...prevOutcomes, ...currentOutcomes];

    return res;
  }, {});
};
