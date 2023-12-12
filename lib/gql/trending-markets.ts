import { PoolOrderByInput, PoolStatus } from "@zeitgeistpm/indexer";
import {
  BaseAssetId,
  FullContext,
  IOForeignAssetId,
  ScalarRangeType,
  Sdk,
} from "@zeitgeistpm/sdk";
import { ZeitgeistPrimitivesMarketMarketCreation } from "@polkadot/types/lookup";
import { IndexedMarketCardData } from "components/markets/market-card/index";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { hiddenMarketIds } from "lib/constants/markets";
import {
  ForeignAssetPrices,
  getBaseAssetPrices,
} from "lib/hooks/queries/useAssetUsdPrice";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";
import { fetchAllPages } from "lib/util/fetch-all-pages";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { marketMetaFilter } from "./constants";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";

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
        hasValidMetaCategories_eq: true
        categories_isNull: false
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
  sdk: Sdk<FullContext>,
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

  const pools = await fetchAllPages(async (pageNumber, limit) => {
    const { pools } = await sdk.indexer.pools({
      limit: limit,
      offset: pageNumber * limit,
      where: { status_eq: PoolStatus.Active },
      order: PoolOrderByInput.IdAsc,
    });
    return pools;
  });

  const basePrices = await getBaseAssetPrices(sdk);

  const trendingPoolIds = calcTrendingPools(historicalPools, basePrices, pools);

  const trendingMarkets = await Promise.all(
    trendingPoolIds.map(async (poolId) => {
      const marketsRes = await client.request<{
        markets: {
          marketId: number;
          img: string;
          question: string;
          creation: ZeitgeistPrimitivesMarketMarketCreation["type"];
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

      if (!market) {
        console.log("No market");
        return null;
      }

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

      if (!market.categories) {
        console.log("No categories for market", market.marketId);
        return null;
      }

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

  return trendingMarkets.filter(isNotNull);
};

const lookupPrice = (
  basePrices: ForeignAssetPrices,
  baseAsset: BaseAssetId,
): Decimal | undefined => {
  return IOForeignAssetId.is(baseAsset)
    ? basePrices[baseAsset.ForeignAsset]
    : basePrices["ztg"];
};

const calcTrendingPools = (
  transactions: {
    poolId: number;
    dVolume: string;
  }[],
  basePrices: ForeignAssetPrices,
  pools: { poolId: number; baseAsset: string; status: string }[],
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
    const base = pools.find((pool) => pool.poolId === Number(poolId))
      ?.baseAsset;

    const value = lookupPrice(
      basePrices,
      parseAssetIdString(base) as BaseAssetId,
    );

    poolVolumes[poolId] = poolVolumes[poolId].mul(value ?? 0);
  }

  const poolIdsByVolumeDesc = Object.keys(poolVolumes).sort((a, b) => {
    const aVol = poolVolumes[a];
    const bVol = poolVolumes[b];
    return bVol.minus(aVol).toNumber();
  });

  return poolIdsByVolumeDesc.splice(0, maxPools);
};

export default getTrendingMarkets;
