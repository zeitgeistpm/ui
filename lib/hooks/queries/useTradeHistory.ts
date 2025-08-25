import { useQuery } from "@tanstack/react-query";
import {
  HistoricalSwapOrderByInput,
  HistoricalSwap,
} from "@zeitgeistpm/indexer";
import {
  getIndexOf,
  getMarketIdOf,
  IOBaseAssetId,
  IOForeignAssetId,
  IOMarketOutcomeAssetId,
  isIndexedSdk,
  isRpcSdk,
  MarketId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { getMarketHeaders, MarketHeader } from "lib/gql/market-header";
import { useSdkv2 } from "../useSdkv2";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";

export const transactionHistoryKey = "trade-history";

const lookupAssetName = (
  asset: string,
  marketsMap: Map<number, MarketHeader>,
  foreignAssetMap: Map<number, string>,
) => {
  const assetId = parseAssetIdStringWithCombinatorial(asset);

  if (IOMarketOutcomeAssetId.is(assetId)) {
    const marketId = getMarketIdOf(assetId);
    const index = getIndexOf(assetId);
    const market = marketsMap.get(marketId);
    return market && market.categories[index].name;
  } else if (IOForeignAssetId.is(assetId)) {
    return foreignAssetMap.get(assetId.ForeignAsset);
  } else {
    return asset.toUpperCase();
  }
};

const lookupMarket = (asset: string, marketsMap: Map<number, MarketHeader>) => {
  const assetId = parseAssetIdStringWithCombinatorial(asset);

  if (IOMarketOutcomeAssetId.is(assetId)) {
    const marketId = getMarketIdOf(assetId);
    const market = marketsMap.get(marketId);
    return market && { question: market.question, marketId: marketId };
  } else {
    return;
  }
};

const calculatePrice = (
  assetIn: string,
  assetOut: string,
  assetAmountIn: string,
  assetAmountOut: string,
) => {
  const assetInId = parseAssetIdStringWithCombinatorial(assetIn);

  const assetInIsBaseAsset = IOBaseAssetId.is(assetInId);

  if (assetInIsBaseAsset) {
    return {
      price: new Decimal(assetAmountIn).div(assetAmountOut),
      baseAsset: assetIn,
    };
  } else {
    return {
      price: new Decimal(assetAmountOut).div(assetAmountIn),
      baseAsset: assetOut,
    };
  }
};

export type TradeHistoryItem = {
  marketId: MarketId;
  question: string;
  assetIn?: string;
  assetOut?: string;
  assetAmountIn: Decimal;
  assetAmountOut: Decimal;
  price: Decimal;
  baseAssetName?: string;
  time: any;
  extrinsic?: HistoricalSwap["extrinsic"];
};

export const useTradeHistory = (address?: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, transactionHistoryKey, address],
    async (): Promise<TradeHistoryItem[]> => {
      if (isIndexedSdk(sdk) && isRpcSdk(sdk) && address) {
        const { historicalSwaps } = await sdk.indexer.historicalSwaps({
          where: {
            accountId_eq: address,
          },
          order: HistoricalSwapOrderByInput.BlockNumberDesc,
        });

        let foreignAssetIds = new Set<number>();
        let marketIds = new Set<number>();

        historicalSwaps.forEach((swap) => {
          const assetInId = parseAssetIdStringWithCombinatorial(swap.assetIn);
          const assetOutId = parseAssetIdStringWithCombinatorial(swap.assetOut);

          if (IOForeignAssetId.is(assetInId)) {
            foreignAssetIds.add(assetInId.ForeignAsset);
          } else if (IOForeignAssetId.is(assetOutId)) {
            foreignAssetIds.add(assetOutId.ForeignAsset);
          }

          if (IOMarketOutcomeAssetId.is(assetInId)) {
            marketIds.add(getMarketIdOf(assetInId));
          } else if (IOMarketOutcomeAssetId.is(assetOutId)) {
            marketIds.add(getMarketIdOf(assetOutId));
          }
        });

        const marketIdsArray = Array.from(marketIds).sort((a, b) => a - b);

        const markets = await getMarketHeaders(sdk, marketIdsArray);

        const marketsMap: Map<number, MarketHeader> = new Map();
        marketIdsArray.forEach((marketId) => {
          const market = markets.find((m) => m.marketId === marketId);
          if (market) {
            marketsMap.set(marketId, market);
          }
        });

        const foreignAssetIdsArray = Array.from(foreignAssetIds);
        const assetMetadata = await Promise.all(
          foreignAssetIdsArray.map((assetId) =>
            sdk.api.query.assetRegistry.metadata({ ForeignAsset: assetId }),
          ),
        );

        const metadataMap: Map<number, string> = new Map();
        assetMetadata.forEach((asset, index) => {
          const symbol = asset.unwrap().symbol.toPrimitive() as string;
          metadataMap.set(foreignAssetIdsArray[index], symbol);
        });

        const trades: TradeHistoryItem[] = historicalSwaps
          .map((swap) => {
            const market =
              lookupMarket(swap.assetIn, marketsMap) ??
              lookupMarket(swap.assetOut, marketsMap);

            if (!market) {
              return;
            }

            const priceInfo = calculatePrice(
              swap.assetIn,
              swap.assetOut,
              swap.assetAmountIn,
              swap.assetAmountOut,
            );

            const item: TradeHistoryItem = {
              marketId: market?.marketId,
              question: market?.question,
              assetIn: lookupAssetName(swap.assetIn, marketsMap, metadataMap),
              assetOut: lookupAssetName(swap.assetOut, marketsMap, metadataMap),
              assetAmountIn: new Decimal(swap.assetAmountIn),
              assetAmountOut: new Decimal(swap.assetAmountOut),
              price: priceInfo.price,
              baseAssetName: lookupAssetName(
                priceInfo.baseAsset,
                marketsMap,
                metadataMap,
              ),
              time: swap.timestamp,
              extrinsic: swap.extrinsic,
            };

            return item;
          })
          .filter((trade): trade is TradeHistoryItem => trade != null);

        return trades;
      }

      return [];
    },
    {
      keepPreviousData: true,
      initialData: [],
      enabled: Boolean(sdk && isIndexedSdk(sdk) && isRpcSdk(sdk) && address),
    },
  );

  return query;
};
