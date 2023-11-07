import { describe, expect, test } from "vitest";
import { calculateMarketCost, get24HrPriceChange, PricePoint } from "./market";

describe("Market utils", () => {
  describe("calculateMarketCost", () => {
    test("should correctly calculate cost of advised market", () => {
      const marketCost = calculateMarketCost(
        { advisedCost: 0.5, permissionlessCost: 1 },
        true,
      );

      expect(marketCost).toEqual(0.5);
    });

    test("should correctly calculate cost of permissionless market", () => {
      const marketCost = calculateMarketCost(
        { advisedCost: 0.5, permissionlessCost: 1 },
        false,
      );

      expect(marketCost).toEqual(1);
    });

    test("should correctly calculate cost of market with equal pools", () => {
      const marketCost = calculateMarketCost(
        { advisedCost: 0.5, permissionlessCost: 1 },
        false,
        [100, 100, 100, 100],
      );

      expect(marketCost).toEqual(201);
    });

    test("should correctly calculate cost of market with pools larger than 100", () => {
      const marketCost = calculateMarketCost(
        { advisedCost: 0.5, permissionlessCost: 1 },
        false,
        [120, 120, 120, 120],
      );

      expect(marketCost).toEqual(241);
    });
  });

  describe("get24HrPriceChange", () => {
    test("should work with date ascending sorted data", () => {
      const prices: PricePoint[] = [
        {
          newPrice: 1000,
          timestamp: "2022-09-28T14:26:36.291000Z",
        },
        {
          newPrice: 2000,
          timestamp: "2022-09-29T14:26:36.291000Z",
        },
        {
          newPrice: 3000,
          timestamp: "2022-09-30T14:26:36.291000Z",
        },
      ];

      const change = get24HrPriceChange(prices);

      expect(change).toEqual(50);
    });
    test("should work with date descending sorted data", () => {
      const prices: PricePoint[] = [
        {
          newPrice: 3000,
          timestamp: "2022-09-30T14:26:36.291000Z",
        },
        {
          newPrice: 2000,
          timestamp: "2022-09-29T14:26:36.291000Z",
        },
        {
          newPrice: 1000,
          timestamp: "2022-09-28T14:26:36.291000Z",
        },
      ];

      const change = get24HrPriceChange(prices);

      expect(change).toEqual(50);
    });
    test("should return 0 when there is a single data point", () => {
      const prices: PricePoint[] = [
        {
          newPrice: 3000,
          timestamp: "2022-09-30T14:26:36.291000Z",
        },
      ];

      const change = get24HrPriceChange(prices);

      expect(change).toEqual(0);
    });
  });
});
