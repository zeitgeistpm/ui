import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card/index";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { MarketOutcomes, MarketOutcome } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";
import {
  BaseAssetId,
  IOForeignAssetId,
  ScalarRangeType,
} from "@zeitgeistpm/sdk-next";
import { hiddenMarketIds } from "lib/constants/markets";
import { marketMetaFilter } from "./constants";
import { FOREIGN_ASSET_METADATA } from "lib/constants/foreign-asset";
import { getForeignAssetPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { fetchZTGInfo } from "@zeitgeistpm/utility/dist/ztg";
import { parseAssetIdString } from "lib/util/parse-asset-id";

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
        ${marketMetaFilter}
      }
    ) {
      marketId
      outcomeAssets
      question
      creation
      img
      baseAsset
      creator
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

  const { historicalPools } = await client.request<{
    historicalPools: {
      dVolume: string;
      poolId: number;
    }[];
  }>(poolChangesQuery, {
    start: dateOneWeekAgo,
    end: now,
  });

  const { pools } = await client.request<{
    pools: { poolId: number; baseAsset: string }[];
  }>(gql`
    query Pools {
      pools {
        poolId
        baseAsset
      }
    }
  `);

  const basePrices = await getBaseAssetPrices();

  const trendingPoolIds = calcTrendingPools(historicalPools, basePrices, pools);

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
          creator: string;
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
          assetId: string;
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
        creator: market.creator,
        volume: Number(new Decimal(market.pool.volume).div(ZTG).toFixed(0)),
        baseAsset: market.baseAsset,
        outcomes: marketCategories,
        pool: market.pool ?? null,
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

type BasePrices = {
  [key: string | "ztg"]: Decimal;
};

const lookupPrice = (basePrices: BasePrices, baseAsset: BaseAssetId) => {
  return IOForeignAssetId.is(baseAsset)
    ? basePrices[baseAsset.ForeignAsset]
    : basePrices["ztg"];
};

const getBaseAssetPrices = async (): Promise<BasePrices> => {
  const assetIds = Object.keys(FOREIGN_ASSET_METADATA);

  const foreignAssetPrices = await Promise.all(
    assetIds.map((id) => getForeignAssetPrice({ ForeignAsset: Number(id) })),
  );

  const pricesObj = foreignAssetPrices.reduce<BasePrices>(
    (obj, price, index) => {
      obj[assetIds[index]] = price;
      return obj;
    },
    {},
  );

  const ztgInfo = await fetchZTGInfo();

  pricesObj["ztg"] = ztgInfo.price;

  return pricesObj;
};

const calcTrendingPools = (
  transactions: {
    poolId: number;
    dVolume: string;
  }[],
  basePrices: BasePrices,
  pools: { poolId: number; baseAsset: string }[],
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

  for (let poolId in poolVolumes) {
    const base = pools.find(
      (pool) => pool.poolId === Number(poolId),
    )?.baseAsset;

    const value = lookupPrice(
      basePrices,
      parseAssetIdString(base) as BaseAssetId,
    );
    poolVolumes[poolId] = poolVolumes[poolId].mul(value);
  }

  const poolIdsByVolumeDesc = Object.keys(poolVolumes).sort((a, b) => {
    const aVol = poolVolumes[a];
    const bVol = poolVolumes[b];
    return bVol.minus(aVol).toNumber();
  });

  return poolIdsByVolumeDesc.splice(0, maxPools);
};

export default getTrendingMarkets;
