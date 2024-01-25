import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOBaseAssetId,
  IOMarketOutcomeAssetId,
  MarketId,
  isRpcSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { MarketOutcome } from "lib/types";

export const ordersRootKey = "orders";

type RawMarketOrderData = {
  makerAmount: Decimal;
  makerAsset: AssetId;
  takerAmount: Decimal;
  takerAsset: AssetId;
};

export type MarketOrder = {
  id: number;
  marketId: number;
  makerAddress: string;
  raw: RawMarketOrderData;
  side: "buy" | "sell";
  price: Decimal;
  outcomeAmount: Decimal;
  outcomeAssetId:
    | {
        CategoricalOutcome: [MarketId, number];
      }
    | {
        ScalarOutcome: [MarketId, "Short" | "Long"];
      };
};

export const useOrders = () => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, ordersRootKey],
    async () => {
      if (isRpcSdk(sdk)) {
        const ordersRes = await sdk.api.query.orderbook.orders.entries();
        const orders: MarketOrder[] = ordersRes.map(([a, b]) => {
          const chainOrder = b.unwrap();
          const rawData: RawMarketOrderData = {
            makerAmount: new Decimal(chainOrder.makerAmount.toString()),
            makerAsset: parseAssetId(
              chainOrder.makerAsset,
            ).unwrap() as unknown as AssetId,
            takerAmount: new Decimal(chainOrder.takerAmount.toString()),
            takerAsset: parseAssetId(
              chainOrder.takerAsset,
            ).unwrap() as unknown as AssetId,
          };

          const side = IOBaseAssetId.is(rawData.makerAsset) ? "buy" : "sell";
          const price = IOBaseAssetId.is(rawData.makerAsset)
            ? rawData.takerAmount.div(rawData.makerAmount)
            : rawData.makerAmount.div(rawData.takerAmount);
          const outcomeAssetId = IOMarketOutcomeAssetId.is(rawData.makerAsset)
            ? rawData.makerAsset
            : IOMarketOutcomeAssetId.is(rawData.takerAsset)
              ? rawData.takerAsset
              : undefined;
          const outcomeAmount = IOBaseAssetId.is(rawData.makerAsset)
            ? rawData.takerAmount
            : rawData.makerAmount;

          const order: MarketOrder = {
            id: Number(a[0]),
            marketId: Number(chainOrder.marketId.toString()),
            makerAddress: chainOrder.maker.toString(),
            raw: rawData,
            side,
            price,
            outcomeAmount,
            outcomeAssetId: outcomeAssetId!, // one of the assets must be MarketOutcome
          };

          return order;
        });
        return orders;
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk)),
      staleTime: 10_000,
    },
  );

  return query;
};
