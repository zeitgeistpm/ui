import { describe, expect, test, vi } from "vitest";
import { Order } from "./routing";
import { MarketId } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";

const orders: Order[] = [
  {
    assetIn: { Ztg: null },
    assetOut: { CategoricalOutcome: [1 as MarketId, 1] },
    amountIn: new Decimal(100),
    amountOut: new Decimal(100),
  },
];

describe("routing", () => {
  test("should route with no pool", () => {});
  test("should route with no pool and utilise mirrored orders", () => {});
  test("should route with no order book", () => {});
  test("should route with order book and pool", () => {});
  test("should route with order book and pool and utilise mirrored orders", () => {});
});
