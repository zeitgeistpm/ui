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
import { CombinatorialToken, isCombinatorialToken } from "lib/types/combinatorial";

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

export const useLatestTrades = (limit?: number, marketId?: number, outcomeAssets?: CombinatorialToken[]) => {
  const [sdk, id] = useSdkv2();
  
  // Check if we have combinatorial tokens to filter by
  const hasComboTokens = outcomeAssets && outcomeAssets.length > 0 && 
    outcomeAssets.every(asset => isCombinatorialToken(asset));

  const query = useQuery(
    [id, transactionHistoryKey, limit, marketId, outcomeAssets],
    async () => {
      if (isIndexedSdk(sdk)) {
        let whereFilter = {};

        if (hasComboTokens) {
          // Filter by combinatorial token hashes
          const comboFilters = outcomeAssets.map(asset => ({
            OR: [
              { assetIn_contains: asset.CombinatorialToken },
              { assetOut_contains: asset.CombinatorialToken },
            ]
          }));

          whereFilter = {
            AND: [
              swapsMetaFilter,
              { OR: comboFilters }
            ]
          };
        } else if (marketId != null) {
          // Fall back to legacy market ID filtering
          whereFilter = {
            AND: [
              swapsMetaFilter,
              {
                OR: [
                  { assetIn_contains: `[${marketId},` },
                  { assetOut_contains: `[${marketId},` },
                ],
              }
            ]
          };
        } else {
          // No specific filtering, get all swaps
          whereFilter = swapsMetaFilter;
        }

        const { historicalSwaps } = await sdk.indexer.historicalSwaps({
          limit: limit,
          order: HistoricalSwapOrderByInput.BlockNumberDesc,
          where: whereFilter,
        });

        if (hasComboTokens) {
          // Handle combinatorial token trades
          const trades: TradeItem[] = historicalSwaps
            .map((swap) => {
              const costSymbol = findBaseAssetSymbol(swap.assetIn, swap.assetOut);
              const assetInId = parseAssetId(swap.assetIn).unwrap();
              const assetInIsBaseAsset = IOBaseAssetId.is(assetInId);

              // Find which combo token was traded
              const comboAsset = findComboAssetInSwap(swap, outcomeAssets);
              if (!comboAsset) return null;

              const item: TradeItem = {
                traderAddress: swap.accountId,
                marketId: marketId || 0, // Use provided marketId or default
                question: "Combinatorial Market", // This could be enhanced with actual market data
                outcomeName: `Combo ${comboAsset.CombinatorialToken.slice(0, 8)}...`,
                type: assetInIsBaseAsset ? "buy" : "sell",
                time: new Date(swap.timestamp),
                cost: assetInIsBaseAsset
                  ? new Decimal(swap.assetAmountIn)
                  : new Decimal(swap.assetAmountOut),
                outcomePrice: assetInIsBaseAsset
                  ? new Decimal(swap.assetAmountIn).div(swap.assetAmountOut)
                  : new Decimal(swap.assetAmountOut).div(swap.assetAmountIn),
                costSymbol,
              };

              return item;
            })
            .filter((trade): trade is TradeItem => trade != null);

          return trades;
        } else {
          // Handle legacy market trades
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
                outcomeName: outcome,
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

// Helper function to find which combo asset was involved in a swap
const findComboAssetInSwap = (swap: any, outcomeAssets: CombinatorialToken[]): CombinatorialToken | null => {
  // Check if either assetIn or assetOut contains one of our combo token hashes
  for (const asset of outcomeAssets) {
    if (swap.assetIn.includes(asset.CombinatorialToken) || swap.assetOut.includes(asset.CombinatorialToken)) {
      return asset;
    }
  }
  return null;
};

const lookupOutcomeAsset = (asset: string, markets: MarketHeader[]) => {
  const assetId = parseAssetId(asset).unwrap();
  const market = lookupMarket(asset, markets);

  if (IOMarketOutcomeAssetId.is(assetId)) {
    const index = getIndexOf(assetId);
    return market && market.categories[index].name;
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
