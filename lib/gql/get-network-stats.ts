import { BaseAssetId, FullContext, Sdk, ZTG } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { fetchAllPages } from "lib/util/fetch-all-pages";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { getBaseAssetHistoricalPrices, lookupPrice } from "./historical-prices";
import {
  PoolOrderByInput,
  NeoPoolOrderByInput,
  HistoricalSwapOrderByInput,
} from "@zeitgeistpm/indexer";

export const getNetworkStats = async (sdk: Sdk<FullContext>) => {
  const [marketCountBN, basePrices, pools, neoPools, historicalSwaps] =
    await Promise.all([
      sdk.api.query.marketCommons.marketCounter(),
      getBaseAssetHistoricalPrices(),
      fetchAllPages(async (pageNumber, limit) => {
        const { pools } = await sdk.indexer.pools({
          limit: limit,
          offset: pageNumber * limit,
          order: PoolOrderByInput.IdAsc,
        });
        return pools;
      }),
      fetchAllPages(async (pageNumber, limit) => {
        const { neoPools } = await sdk.indexer.neoPools({
          limit: limit,
          offset: pageNumber * limit,
          order: NeoPoolOrderByInput.IdAsc,
        });
        return neoPools;
      }),
      fetchAllPages(async (pageNumber, limit) => {
        const { historicalSwaps } = await sdk.indexer.historicalSwaps({
          limit: limit,
          offset: pageNumber * limit,
          order: HistoricalSwapOrderByInput.IdAsc,
        });
        return historicalSwaps;
      }),
    ]);

  const totalPoolVolumeUsd = pools.reduce<Decimal>((total, pool) => {
    const poolCreationBaseAssetPrice = lookupPrice(
      basePrices,
      parseAssetIdString(pool.baseAsset) as BaseAssetId,
      new Date(pool.createdAt).getTime(),
    );

    const volumeUsd = new Decimal(pool.volume).mul(
      poolCreationBaseAssetPrice ?? 0,
    );

    return total.plus(volumeUsd);
  }, new Decimal(0));

  const totalNeopoolVolumeUsd = pools.reduce<Decimal>((total, pool) => {
    const poolCreationBaseAssetPrice = lookupPrice(
      basePrices,
      parseAssetIdString(pool.baseAsset) as BaseAssetId,
      new Date(pool.createdAt).getTime(),
    );

    const volumeUsd = new Decimal(pool.volume).mul(
      poolCreationBaseAssetPrice ?? 0,
    );

    return total.plus(volumeUsd);
  }, new Decimal(0));

  const tradersCount = historicalSwaps.reduce<Set<string>>(
    (traders, swap) => traders.add(swap.accountId),
    new Set(),
  ).size;

  return {
    marketCount: marketCountBN.toNumber(),
    tradersCount,
    volumeUsd: totalNeopoolVolumeUsd
      .plus(totalPoolVolumeUsd)
      .div(ZTG)
      .toNumber(),
  };
};
