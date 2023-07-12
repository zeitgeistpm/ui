import { useQuery } from "@tanstack/react-query";
import {
  getIndexOf,
  getMarketIdOf,
  IOBaseAssetId,
  IOMarketOutcomeAssetId,
  isIndexedSdk,
  isRpcSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { gql } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";
import { HistoricalSwapOrderByInput } from "@zeitgeistpm/indexer";
import { marketMetaFilter } from "lib/gql/constants";
import { BLOCK_TIME_SECONDS } from "lib/constants";

export const transactionHistoryKey = "latest-trades";

const marketHeaderQuery = gql`
  query MarketTransactionHeader($marketIds: [Int!]) {
    markets(
      where: {
        marketId_in: $marketIds
        ${marketMetaFilter}
      }
      orderBy: marketId_ASC
    ) {
      marketId
      question
      categories {
        name
      }
    }
  }
`;

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

type MarketHeader = {
  marketId: number;
  question: string;
  categories: { name: string }[];
};

export type TradeItem = {
  marketId: number;
  question: string;
  type: "buy" | "sell";
  outcomeName: string;
  outcomePrice: Decimal;
  time: Date;
  cost: Decimal;
};

export const useLatestTrades = () => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, transactionHistoryKey],
    async () => {
      if (isIndexedSdk(sdk) && isRpcSdk(sdk)) {
        const { historicalSwaps } = await sdk.indexer.historicalSwaps({
          limit: 3,
          order: HistoricalSwapOrderByInput.BlockNumberDesc,
        });

        let marketIds = new Set<number>();

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

        const { markets } = await sdk.indexer.client.request<{
          markets: MarketHeader[];
        }>(marketHeaderQuery, {
          marketIds: marketIdsArray,
        });

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
      initialData: [],
      enabled: Boolean(sdk && isIndexedSdk(sdk) && isRpcSdk(sdk)),
      refetchInterval: BLOCK_TIME_SECONDS * 1000,
    },
  );

  return query;
};
