import Decimal from "decimal.js";
import { describe, expect, test } from "vitest";
import {
  MarketOrder,
  selectOrdersForMarketBuy,
  selectOrdersForMarketSell,
} from "./order-selection";

const ordersMock1: MarketOrder[] = [
  {
    price: new Decimal(0.8),
    amount: new Decimal(100),
    side: "sell",
  },
  {
    price: new Decimal(0.7),
    amount: new Decimal(100),
    side: "sell",
  },
  {
    price: new Decimal(0.6),
    amount: new Decimal(100),
    side: "sell",
  },
  {
    price: new Decimal(0.4),
    amount: new Decimal(100),
    side: "buy",
  },
  {
    price: new Decimal(0.3),
    amount: new Decimal(100),
    side: "buy",
  },
  {
    price: new Decimal(0.2),
    amount: new Decimal(100),
    side: "buy",
  },
];

describe("order selection", () => {
  describe("selectOrdersForMarketBuy", () => {
    test("should select all orders", () => {
      const orders = selectOrdersForMarketBuy(
        new Decimal(0.5),
        new Decimal(0.9),
        ordersMock1,
        new Decimal(1000),
      );

      expect(orders.length).toEqual(3);
    });

    test("should select some orders if constrained by price", () => {
      const orders = selectOrdersForMarketBuy(
        new Decimal(0.5),
        new Decimal(0.7),
        ordersMock1,
        new Decimal(1000),
      );

      expect(orders.length).toEqual(2);
    });

    test("should select some orders if constrained by amount", () => {
      const orders = selectOrdersForMarketBuy(
        new Decimal(0.5),
        new Decimal(1),
        ordersMock1,
        new Decimal(100),
      );

      const { price, amount, side } = orders[0];
      expect(price.toNumber()).toEqual(0.6);
      expect(amount.toNumber()).toEqual(100);
      expect(side).toEqual("sell");
      expect(orders.length).toEqual(1);
    });
  });
  describe("selectOrdersForMarketBuy", () => {
    test("should select all orders", () => {
      const orders = selectOrdersForMarketSell(
        new Decimal(0.5),
        new Decimal(0.1),
        ordersMock1,
        new Decimal(1000),
      );

      expect(orders.length).toEqual(3);
    });

    test("should select some orders if constrained by price", () => {
      const orders = selectOrdersForMarketSell(
        new Decimal(0.5),
        new Decimal(0.4),
        ordersMock1,
        new Decimal(1000),
      );

      expect(orders.length).toEqual(1);
    });

    test("should select some orders if constrained by amount", () => {
      const orders = selectOrdersForMarketSell(
        new Decimal(0.5),
        new Decimal(0),
        ordersMock1,
        new Decimal(100),
      );

      const { price, amount, side } = orders[0];
      expect(price.toNumber()).toEqual(0.4);
      expect(amount.toNumber()).toEqual(100);
      expect(side).toEqual("buy");
      expect(orders.length).toEqual(1);
    });
  });
});
