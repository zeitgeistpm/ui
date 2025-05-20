import { useQuery } from "@tanstack/react-query";
import { InputMaybe, OrderStatus, OrderWhereInput } from "@zeitgeistpm/indexer";
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

export const ordersRootKey = "orders";

// Define the interface for the GraphQL response
interface OrderResponse {
  __typename?: "Order";
  id: string;
  marketId: number;
  makerAccountId: string;
  updatedAt: any;
  createdAt: any;
  status: OrderStatus; // Explicitly define status property
  maker: {
    __typename?: "OrderRecord";
    asset: string;
    filledAmount: any;
    unfilledAmount: any;
  };
  taker: {
    __typename?: "OrderRecord";
    asset: string;
    filledAmount: any;
    unfilledAmount: any;
  };
}

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
  filledPercentage: number;
  status: OrderStatus;
};

export const useOrders = (where?: InputMaybe<OrderWhereInput>) => {
  const [sdk, id] = useSdkv2();
  const enabled = !!sdk && !!isIndexedSdk(sdk);

  const query = useQuery(
    [id, ordersRootKey, where],
    async () => {
      if (enabled) {
        // Type the response from the GraphQL query
        const { orders } = await sdk.indexer.orders({ where }) as { orders: OrderResponse[] };
        
        const ordersMapped: Order[] = orders.map((order: OrderResponse) => {
          const makerAsset = parseAssetId(
            order.maker.asset,
          ).unwrap() as unknown as AssetId;
          const takerAsset = parseAssetId(
            order.taker.asset,
          ).unwrap() as unknown as AssetId;

          const side = IOBaseAssetId.is(makerAsset) ? "buy" : "sell";
          const takerInitialAmount = new Decimal(order.taker.filledAmount).plus(
            order.taker.unfilledAmount,
          );
          const makerInitialAmount = new Decimal(order.maker.filledAmount).plus(
            order.maker.unfilledAmount,
          );
          const price = IOBaseAssetId.is(makerAsset)
            ? makerInitialAmount.div(takerInitialAmount)
            : takerInitialAmount.div(makerInitialAmount);

          const outcomeAssetId = IOMarketOutcomeAssetId.is(makerAsset)
            ? makerAsset
            : IOMarketOutcomeAssetId.is(takerAsset)
              ? takerAsset
              : undefined;

          const outcomeAmount = IOBaseAssetId.is(makerAsset)
            ? takerInitialAmount
            : makerInitialAmount;

          const filledPercentage = new Decimal(order.taker.filledAmount)
            .div(takerInitialAmount)
            .mul(100)
            .toNumber();

          const mappedOrder: Order = {
            id: order.id,
            marketId: order.marketId,
            makerAddress: order.makerAccountId,
            side,
            price,
            outcomeAmount: outcomeAmount,
            outcomeAssetId: outcomeAssetId!, // one of the assets must be MarketOutcome
            filledPercentage,
            status: order.status, // Now TypeScript knows this exists
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