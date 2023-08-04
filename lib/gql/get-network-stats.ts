import { BaseAssetId, FullContext, Sdk, ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { getBaseAssetHistoricalPrices, lookupPrice } from "./historical-prices";

export const getNetworkStats = async (sdk: Sdk<FullContext>) => {
  const marketCountBN = await sdk.api.query.marketCommons.marketCounter();
  const basePrices = await getBaseAssetHistoricalPrices();
  const { pools } = await sdk.indexer.pools();

  const totalVolumeUsd = pools.reduce<Decimal>((total, pool) => {
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

  const { historicalSwaps } = await sdk.indexer.historicalSwaps();
  const tradersCount = historicalSwaps.reduce<Set<string>>(
    (traders, swap) => traders.add(swap.accountId),
    new Set(),
  ).size;

  return {
    marketCount: marketCountBN.toNumber(),
    tradersCount,
    volumeUsd: totalVolumeUsd.div(ZTG).toNumber(),
  };
};
