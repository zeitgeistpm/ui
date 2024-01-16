import { BaseAssetId, FullContext, Sdk, ZTG } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { fetchAllPages } from "lib/util/fetch-all-pages";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { getBaseAssetHistoricalPrices, lookupPrice } from "./historical-prices";
import {
  PoolOrderByInput,
  MarketOrderByInput,
  NeoPoolOrderByInput,
  HistoricalSwapOrderByInput,
} from "@zeitgeistpm/indexer";
import { MarketsOrderBy } from "lib/types/market-filter";

export const getNetworkStats = async (sdk: Sdk<FullContext>) => {
  const [marketCountBN, basePrices, markets, historicalSwaps] =
    await Promise.all([
      sdk.api.query.marketCommons.marketCounter(),
      getBaseAssetHistoricalPrices(),
      fetchAllPages(async (pageNumber, limit) => {
        const { markets } = await sdk.indexer.markets({
          limit: limit,
          offset: pageNumber * limit,
          order: MarketOrderByInput.IdAsc,
        });
        return markets;
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

  const totalMarketVolumeUsd = markets.reduce<Decimal>((total, market) => {
    const poolCreationBaseAssetPrice = lookupPrice(
      basePrices,
      parseAssetIdString(market.baseAsset) as BaseAssetId,
      new Date(market.pool?.createdAt ?? market.neoPool?.createdAt).getTime(),
    );

    const volumeUsd = new Decimal(market.volume).mul(
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
    volumeUsd: totalMarketVolumeUsd.div(ZTG).toNumber(),
  };
};
