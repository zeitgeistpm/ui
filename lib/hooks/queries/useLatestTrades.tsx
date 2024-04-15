import { useQuery } from "@tanstack/react-query";
import { HistoricalSwapOrderByInput } from "@zeitgeistpm/indexer";
import {
  getIndexOf,
  getMarketIdOf,
  IOBaseAssetId,
  IOForeignAssetId,
  IOMarketOutcomeAssetId,
  isIndexedSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { BLOCK_TIME_SECONDS } from "lib/constants";
import { lookupAssetSymbol } from "lib/constants/foreign-asset";
import { getMarketHeaders, MarketHeader } from "lib/gql/market-header";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useSdkv2 } from "../useSdkv2";
import { swapsMetaFilter } from "./constants";
import { findAsset } from "lib/util/assets";

export const transactionHistoryKey = "latest-trades";

export type TradeItem = {
  traderAddress: string;
  marketId: number;
  question: string;
  type: "buy" | "sell";
  outcomeName: string;
  outcomePrice: Decimal;
  time: Date;
  cost: Decimal;
  costSymbol: string;
};

export const useLatestTrades = (limit?: number, marketId?: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, transactionHistoryKey, limit, marketId],
    async () => {
      if (isIndexedSdk(sdk)) {
        const { historicalSwaps } = await sdk.indexer.historicalSwaps({
          limit: limit,
          order: HistoricalSwapOrderByInput.BlockNumberDesc,
          where: {
            AND: [
              swapsMetaFilter,
              marketId != null
                ? {
                    OR: [
                      { assetIn_contains: `[${marketId},` },
                      { assetOut_contains: `[${marketId},` },
                    ],
                  }
                : {},
            ],
          },
        });

        const marketIds = new Set<number>();

        historicalSwaps.forEach((swap) => {
          const assetInId = parseAssetId(swap.assetIn).unwrap();
          const assetOutId = parseAssetId(swap.assetOut).unwrap();

          if (IOMarketOutcomeAssetId.is(assetInId)) {
            marketIds.add(getMarketIdOf(assetInId));
          } else if (IOMarketOutcomeAssetId.is(assetOutId)) {
            marketIds.add(getMarketIdOf(assetOutId));
          }
        });

        const marketIdsArray = Array.from(marketIds).sort((a, b) => a - b);

        const markets = await getMarketHeaders(sdk, marketIdsArray);

        const trades: TradeItem[] = historicalSwaps
          .map((swap) => {
            const market =
              lookupMarket(swap.assetIn, markets) ??
              lookupMarket(swap.assetOut, markets);
            const outcome =
              lookupOutcomeAsset(swap.assetIn, markets) ??
              lookupOutcomeAsset(swap.assetOut, markets);

            if (!market || !outcome) {
              return;
            }

            const costSymbol = findBaseAssetSymbol(swap.assetIn, swap.assetOut);

            const assetInId = parseAssetId(swap.assetIn).unwrap();
            const assetInIsBaseAsset = IOBaseAssetId.is(assetInId);

            const item: TradeItem = {
              traderAddress: swap.accountId,
              marketId: market.marketId,
              question: market.question,
              outcomeName: outcome.name ?? "",
              type: assetInIsBaseAsset === true ? "buy" : "sell",
              time: new Date(swap.timestamp),
              cost:
                assetInIsBaseAsset === true
                  ? new Decimal(swap.assetAmountIn)
                  : new Decimal(swap.assetAmountOut),
              outcomePrice:
                assetInIsBaseAsset === true
                  ? new Decimal(swap.assetAmountIn).div(swap.assetAmountOut)
                  : new Decimal(swap.assetAmountOut).div(swap.assetAmountIn),
              costSymbol,
            };

            return item;
          })
          .filter((trade): trade is TradeItem => trade != null);

        return trades;
      }

      return [];
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isIndexedSdk(sdk)),
      refetchInterval: BLOCK_TIME_SECONDS * 1000 * 3, //3 blocks
      staleTime: Infinity,
    },
  );

  return query;
};

const lookupOutcomeAsset = (asset: string, markets: MarketHeader[]) => {
  const assetId = parseAssetId(asset).unwrap();
  const market = lookupMarket(asset, markets);

  if (IOMarketOutcomeAssetId.is(assetId)) {
    return market && findAsset(assetId, market.assets);
  }
};

const findBaseAssetSymbol = (asset1: string, asset2: string) => {
  const asset1Obj = parseAssetIdString(asset1);
  const asset2Obj = parseAssetIdString(asset2);

  if (IOForeignAssetId.is(asset1Obj)) {
    return lookupAssetSymbol(asset1Obj);
  }
  if (IOForeignAssetId.is(asset2Obj)) {
    return lookupAssetSymbol(asset2Obj);
  }
  return lookupAssetSymbol();
};

const lookupMarket = (asset: string, markets: MarketHeader[]) => {
  const assetId = parseAssetId(asset).unwrap();

  if (IOMarketOutcomeAssetId.is(assetId)) {
    const marketId = getMarketIdOf(assetId);
    const market = markets.find((market) => market.marketId === marketId);
    return market;
  }
};
