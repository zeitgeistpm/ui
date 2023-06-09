import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card/index";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { MarketOutcomes, MarketOutcome } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";
import { ScalarRangeType } from "@zeitgeistpm/sdk-next";
import { hiddenMarketIds } from "lib/constants/markets";

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
    markets(
      where: {
        pool: { poolId_eq: $poolId }
        marketId_not_in: ${hiddenMarketIds}
        question_not_eq: ""
        question_isNull: false
        isMetaComplete_eq: true
      }
    ) {
      marketId
      outcomeAssets
      question
      creation
      img
      baseAsset
      marketType {
        categorical
        scalar
      }
      categories {
        color
        name
      }
      pool {
        volume
      }
      outcomeAssets
      tags
      period {
        end
      }
      status
      scalarType
    }
  }
`;

const assetsQuery = gql`
  query Assets($poolId: Int) {
    assets(where: { pool: { poolId_eq: $poolId } }) {
      pool {
        poolId
      }
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
          categories: { color: string; name: string }[];
          outcomeAssets: string[];
          baseAsset: string;
          pool: {
            volume: string;
          };
          tags: [];
          status: string;
          scalarType: ScalarRangeType;
          period: { end: string };
        }[];
      }>(marketQuery, {
        poolId: Number(poolId),
      });

      const market = marketsRes.markets[0];

      const assetsRes = await client.request<{
        assets: {
          pool: { poolId: number };
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
        baseAsset: market.baseAsset,
        outcomes: marketCategories,
        pool: market.pool,
        marketType: market.marketType,
        tags: market.tags,
        status: market.status,
        scalarType: market.scalarType,
        endDate: market.period.end,
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
