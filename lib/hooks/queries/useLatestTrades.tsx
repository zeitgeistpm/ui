import { useQuery } from "@tanstack/react-query";
import { HistoricalSwapOrderByInput } from "@zeitgeistpm/indexer";
import {
  getIndexOf,
  getMarketIdOf,
  IOBaseAssetId,
  IOMarketOutcomeAssetId,
  isIndexedSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { BLOCK_TIME_SECONDS } from "lib/constants";
import { getMarketHeaders, MarketHeader } from "lib/gql/market-header";
import { useSdkv2 } from "../useSdkv2";
import { swapsMetaFilter } from "./constants";

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
      refetchInterval: BLOCK_TIME_SECONDS * 1000,
    },
  );

  return query;
};

const lookupOutcomeAsset = (asset: string, markets: MarketHeader[]) => {
  const assetId = parseAssetId(asset).unwrap();
  const market = lookupMarket(asset, markets);

  if (IOMarketOutcomeAssetId.is(assetId)) {
    const index = getIndexOf(assetId);
    return market && market.categories[index].name;
  }
};

const lookupMarket = (asset: string, markets: MarketHeader[]) => {
  const assetId = parseAssetId(asset).unwrap();

  if (IOMarketOutcomeAssetId.is(assetId)) {
    const marketId = getMarketIdOf(assetId);
    const market = markets.find((market) => market.marketId === marketId);
    return market;
  }
};
