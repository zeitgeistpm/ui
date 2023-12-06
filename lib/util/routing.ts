import {
  AssetId,
  IOCategoricalAssetId,
  IOScalarAssetId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { assetsAreEqual } from "./assets-are-equal";

//sell yes at 0.7 is the buy no at 0.3 (buy full set for 1 then sell yes)

export type Order = {
  assetIn: AssetId;
  assetOut: AssetId;
  amountIn: Decimal;
  amountOut: Decimal;
};

export type Pool = {};

type TradeStep = {
  type: "amm" | "orderbook" | "orderbook-mint" | "orderbook-burn";
  amountIn: Decimal;
};

export type TradeRoute = {
  tx: any;
  amountIn: Decimal;
  amountOut: Decimal;
  trades: TradeStep[];
};

const findBestRoute = (
  pool,
  orders: Order[],
  assetIn: AssetId,
  assetOut: AssetId,
  amountIn: Decimal,
) => {
  const relaventOrders = orders.filter(
    (order) =>
      assetsAreEqual(order.assetIn, assetIn) &&
      assetsAreEqual(order.assetOut, assetOut),
  );

  //   const mirroredOrders = relaventOrders.
};

const findMirroredAsset = (assetId: AssetId): AssetId | null => {
  if (IOCategoricalAssetId.is(assetId)) {
    const marketId = assetId.CategoricalOutcome[0];
    return assetId.CategoricalOutcome[1] === 1
      ? { CategoricalOutcome: [marketId, 0] }
      : { CategoricalOutcome: [marketId, 1] };
  } else if (IOScalarAssetId.is(assetId)) {
    const marketId = assetId.ScalarOutcome[0];
    return assetId.ScalarOutcome[1] === "Long"
      ? { ScalarOutcome: [marketId, "Short"] }
      : { ScalarOutcome: [marketId, "Long"] };
  }

  return null;
};
