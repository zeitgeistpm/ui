import { useQuery } from "@tanstack/react-query";
import { InputMaybe, OrderWhereInput } from "@zeitgeistpm/indexer";
import {
  AssetId,
  IOBaseAssetId,
  IOMarketOutcomeAssetId,
  MarketId,
  isIndexedSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const ordersRootKey = "order";

export type Order = {
  id: string;
  marketId: number;
  makerAddress: string;
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

export const useOrders = (where?: InputMaybe<OrderWhereInput>) => {
  const [sdk, id] = useSdkv2();
  const enabled = !!sdk && !!isIndexedSdk(sdk);

  const query = useQuery(
    [id, ordersRootKey, where],
    async () => {
      if (enabled) {
        const { orders } = await sdk.indexer.orders({ where });

        const ordersMapped: Order[] = orders.map((order) => {
          const makerAsset = parseAssetId(
            order.maker.asset,
          ).unwrap() as unknown as AssetId;
          const takerAsset = parseAssetId(
            order.taker.asset,
          ).unwrap() as unknown as AssetId;

          const side = IOBaseAssetId.is(makerAsset) ? "buy" : "sell";
          const price = IOBaseAssetId.is(makerAsset)
            ? new Decimal(order.taker.initialAmount).div(
                order.maker.initialAmount,
              )
            : new Decimal(order.maker.initialAmount).div(
                order.taker.initialAmount,
              );

          const outcomeAssetId = IOMarketOutcomeAssetId.is(makerAsset)
            ? makerAsset
            : IOMarketOutcomeAssetId.is(takerAsset)
              ? takerAsset
              : undefined;

          const outcomeAmount = IOBaseAssetId.is(makerAsset)
            ? order.taker.initialAmount
            : order.maker.initialAmount;

          const mappedOrder: Order = {
            id: order.id,
            marketId: order.marketId,
            makerAddress: order.makerAccountId,
            side,
            price,
            outcomeAmount: new Decimal(outcomeAmount),
            outcomeAssetId: outcomeAssetId!, // one of the assets must be MarketOutcome
          };

          return mappedOrder;
        });

        return ordersMapped;
      }
    },
    {
      enabled,
      staleTime: 10_000,
    },
  );

  return query;
};
