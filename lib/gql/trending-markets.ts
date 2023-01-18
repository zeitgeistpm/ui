import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { MarketOutcomes, MarketOutcome } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";

const poolChangesQuery = gql`
  query PoolChanges($start: DateTime, $end: DateTime) {
    historicalPools(
      where: {
        timestamp_gt: $start
        volume_gt: "0"
        event_contains: "Swap"
        timestamp_lt: $end
      }
      orderBy: id_DESC
    ) {
      poolId
      dVolume
    }
  }
`;

const marketQuery = gql`
  query Market($poolId: Int) {
    markets(where: { pool: { poolId_eq: $poolId } }) {
      marketId
      outcomeAssets
      question
      creation
      img
      marketType {
        categorical
        scalar
      }
      categories {
        color
        name
        ticker
      }
      pool {
        volume
        baseAsset
      }
      outcomeAssets
    }
  }
`;

const assetsQuery = gql`
  query Assets($poolId: Int) {
    assets(where: { poolId_eq: $poolId }) {
      poolId
      price
      assetId
    }
  }
`;

const getTrendingMarkets = async (
  client: GraphQLClient,
): Promise<IndexedMarketCardData[]> => {
  const now = new Date().toISOString();
  const dateOneWeekAgo = new Date(
    new Date().getTime() - DAY_SECONDS * 7 * 1000,
  ).toISOString();

  const response = await client.request<{
    historicalPools: {
      dVolume: string;
      poolId: number;
    }[];
  }>(poolChangesQuery, {
    start: dateOneWeekAgo,
    end: now,
  });

  const trendingPoolIds = calcTrendingPools(response.historicalPools);

  const trendingMarkets = await Promise.all(
    trendingPoolIds.map(async (poolId) => {
      const marketsRes = await client.request<{
        markets: {
          marketId: number;
          img: string;
          question: string;
          creation: MarketCreation;
          marketType: { [key: string]: string };
          categories: { color: string; name: string; ticker: string }[];
          outcomeAssets: string[];
          pool: {
            volume: string;
            baseAsset: string;
          };
        }[];
      }>(marketQuery, {
        poolId: Number(poolId),
      });

      const market = marketsRes.markets[0];

      const assetsRes = await client.request<{
        assets: {
          poolId: number;
          price: number;
        }[];
      }>(assetsQuery, {
        poolId: Number(poolId),
      });

      const assets = assetsRes.assets;

      const prediction = getCurrentPrediction(assets, market);

      const marketCategories: MarketOutcomes = market.categories.map(
        (category, index) => {
          const asset = assets[index];
          const marketCategory: MarketOutcome = {
            ...category,
            assetId: market.outcomeAssets[index],
            price: asset.price,
          };

          return marketCategory;
        },
      );

      const trendingMarket: IndexedMarketCardData = {
        marketId: market.marketId,
        question: market.question,
        creation: market.creation,
        img: market.img,
        prediction: prediction,
        volume: Number(new Decimal(market.pool.volume).div(ZTG).toFixed(0)),
        baseAsset: market.pool.baseAsset,
        outcomes: marketCategories,
      };

      return trendingMarket;
    }),
  );
  return trendingMarkets;
};

const calcTrendingPools = (
  transactions: {
    poolId: number;
    dVolume: string;
  }[],
) => {
  const poolVolumes: { [key: string]: Decimal } = {};
  const maxPools = 8;

  // find total volume for each pool
  transactions.forEach((transaction) => {
    const volume = poolVolumes[transaction.poolId];
    if (volume) {
      poolVolumes[transaction.poolId] = volume.plus(transaction.dVolume);
    } else {
      poolVolumes[transaction.poolId] = new Decimal(transaction.dVolume);
    }
  });

  const poolIdsByVolumeDesc = Object.keys(poolVolumes).sort((a, b) => {
    const aVol = poolVolumes[a];
    const bVol = poolVolumes[b];
    return bVol.minus(aVol).toNumber();
  });

  return poolIdsByVolumeDesc.splice(0, maxPools);
};

export default getTrendingMarkets;
