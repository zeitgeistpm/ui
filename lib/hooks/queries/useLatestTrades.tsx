import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
import {
  parseAssetIdString,
  parseAssetIdStringWithCombinatorial,
} from "lib/util/parse-asset-id";
import { useSdkv2 } from "../useSdkv2";
import { swapsMetaFilter } from "./constants";
import {
  CombinatorialToken,
  isCombinatorialToken,
} from "lib/types/combinatorial";
import { useMarket } from "./useMarket";

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

interface UseLatestTradesParams {
  limit?: number;
  marketId?: number;
  outcomeAssets?: CombinatorialToken[];
  outcomeNames?: string[];
  marketQuestion?: string;
}

export const useLatestTrades = (
  limitOrParams?: number | UseLatestTradesParams,
  legacyMarketId?: number,
  legacyOutcomeAssets?: CombinatorialToken[],
) => {
  const [sdk, id] = useSdkv2();

  // Handle both legacy and new parameter formats
  const params =
    typeof limitOrParams === "number"
      ? {
          limit: limitOrParams,
          marketId: legacyMarketId,
          outcomeAssets: legacyOutcomeAssets,
        }
      : limitOrParams || {};

  const { limit, marketId, outcomeAssets, outcomeNames, marketQuestion } =
    params;

    // Fetch market data if we have marketId
  const { data: market } = useMarket(
    marketId ? { marketId } : undefined,
  );

  // Determine if we're dealing with combinatorial tokens
  const hasExplicitComboTokens = Boolean(
    outcomeAssets?.length &&
      outcomeAssets.every((asset) => isCombinatorialToken(asset)),
  );

  const marketUsesComboTokens = Boolean(
    market?.outcomeAssets.some((assetString) => {
      const parsedAsset = parseAssetIdStringWithCombinatorial(assetString);
      return isCombinatorialToken(parsedAsset);
    }),
  );

  const isComboMarket = hasExplicitComboTokens || marketUsesComboTokens;

  // Parse combo assets once for reuse in processing
  const comboAssetsForProcessing = useMemo(() => {
    if (hasExplicitComboTokens) return outcomeAssets!;

    if (marketUsesComboTokens && market) {
      return market.outcomeAssets
        .map((assetString) => {
          const parsed = parseAssetIdStringWithCombinatorial(assetString);
          return isCombinatorialToken(parsed) ? parsed : null;
        })
        .filter((asset): asset is CombinatorialToken => asset !== null);
    }

    return [];
  }, [
    hasExplicitComboTokens,
    marketUsesComboTokens,
    outcomeAssets,
    market?.outcomeAssets,
  ]);

  const query = useQuery(
    [
      id,
      transactionHistoryKey,
      limit,
      marketId,
      outcomeAssets,
      outcomeNames,
      isComboMarket,
    ],
    async () => {
      if (isIndexedSdk(sdk)) {
        let whereFilter = {};

        // Build where filter based on market type
        if (isComboMarket) {
          const tokensToFilter = hasExplicitComboTokens
            ? outcomeAssets!.map((asset) => asset.CombinatorialToken)
            : market!.outcomeAssets;

          const comboFilters = tokensToFilter.map((token) => ({
            OR: [{ assetIn_contains: token }, { assetOut_contains: token }],
          }));

          whereFilter = {
            AND: [swapsMetaFilter, { OR: comboFilters }],
          };
        } else if (marketId != null) {
          whereFilter = {
            AND: [
              swapsMetaFilter,
              {
                OR: [
                  { assetIn_contains: `[${marketId},` },
                  { assetOut_contains: `[${marketId},` },
                ],
              },
            ],
          };
        } else {
          whereFilter = swapsMetaFilter;
        }

        const { historicalSwaps } = await sdk.indexer.historicalSwaps({
          limit: limit,
          order: HistoricalSwapOrderByInput.BlockNumberDesc,
          where: whereFilter,
        });

        if (isComboMarket) {
          // Handle combinatorial token trades
          const trades: TradeItem[] = historicalSwaps
            .map((swap) => {
              const costSymbol = findBaseAssetSymbol(
                swap.assetIn,
                swap.assetOut,
              );
              const assetInId = parseAssetIdStringWithCombinatorial(
                swap.assetIn,
              );
              const assetInIsBaseAsset =
                !isCombinatorialToken(assetInId) && IOBaseAssetId.is(assetInId);

              // Find which combo token was traded and get its name
              const { asset: comboAsset, name: outcomeName } =
                findComboAssetWithName(
                  swap,
                  comboAssetsForProcessing,
                  outcomeNames ||
                    market?.categories
                      ?.map((cat) => cat.name)
                      .filter((name): name is string => !!name),
                );

              if (!comboAsset) return null;

              const item: TradeItem = {
                traderAddress: swap.accountId,
                marketId: marketId || 0,
                question: market?.question || marketQuestion || "",
                outcomeName:
                  outcomeName || "",
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
            const assetInId = parseAssetIdStringWithCombinatorial(swap.assetIn);
            const assetOutId = parseAssetIdStringWithCombinatorial(
              swap.assetOut,
            );

            if (
              !isCombinatorialToken(assetInId) &&
              IOMarketOutcomeAssetId.is(assetInId)
            ) {
              marketIds.add(getMarketIdOf(assetInId));
            } else if (
              !isCombinatorialToken(assetOutId) &&
              IOMarketOutcomeAssetId.is(assetOutId)
            ) {
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
                return null;
              }

              const costSymbol = findBaseAssetSymbol(
                swap.assetIn,
                swap.assetOut,
              );
              const assetInId = parseAssetIdStringWithCombinatorial(
                swap.assetIn,
              );
              const assetInIsBaseAsset =
                !isCombinatorialToken(assetInId) && IOBaseAssetId.is(assetInId);

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
      enabled: Boolean(
        sdk &&
          isIndexedSdk(sdk) &&
          // If marketId is provided but no explicit outcomeAssets, wait for market data
          (marketId == null || outcomeAssets != null || market != null),
      ),
      refetchInterval: BLOCK_TIME_SECONDS * 1000 * 3,
      staleTime: Infinity,
    },
  );

  return query;
};

const findComboAssetWithName = (
  swap: any,
  outcomeAssets: CombinatorialToken[],
  outcomeNames?: string[],
): { asset: CombinatorialToken | null; name: string | null } => {
  for (let i = 0; i < outcomeAssets.length; i++) {
    const asset = outcomeAssets[i];
    if (
      swap.assetIn.includes(asset.CombinatorialToken) ||
      swap.assetOut.includes(asset.CombinatorialToken)
    ) {
      return {
        asset,
        name: outcomeNames?.[i] || null,
      };
    }
  }
  return { asset: null, name: null };
};

const lookupOutcomeAsset = (asset: string, markets: MarketHeader[]) => {
  const assetId = parseAssetIdStringWithCombinatorial(asset);
  const market = lookupMarket(asset, markets);

  // Handle combinatorial tokens
  if (isCombinatorialToken(assetId)) {
    // For combinatorial tokens, we can't use getIndexOf
    // Return a generic name or try to find it in the market categories
    return "Combinatorial Outcome";
  }

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
  const assetId = parseAssetIdStringWithCombinatorial(asset);

  // Handle combinatorial tokens
  if (isCombinatorialToken(assetId)) {
    // For combinatorial tokens, we can't use getMarketIdOf
    // Return null or handle differently based on your needs
    return null;
  }

  if (IOMarketOutcomeAssetId.is(assetId)) {
    const marketId = getMarketIdOf(assetId);
    const market = markets.find((market) => market.marketId === marketId);
    return market;
  }
};
