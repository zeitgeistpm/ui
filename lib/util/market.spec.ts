import { calculateMarketCost } from "./market";

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
});
