import Decimal from "decimal.js";
import {
  calcPrices,
  calcWeightGivenSpotPrice,
  PricePoint,
} from "./weight-math";

describe("weight math", () => {
  describe("calcWeightGivenSpotPrice", () => {
    const ztgWeight = new Decimal(100);
    const tokenAmounts = new Decimal(100);
    test("should work", () => {
      const spotPrice = new Decimal(0.3);

      const weight = calcWeightGivenSpotPrice(
        tokenAmounts,
        ztgWeight,
        tokenAmounts,
        spotPrice,
      );

      expect(weight.toNumber()).toEqual(30);
    });
  });

  describe("calcPrices", () => {
    test("should not change locked prices", () => {
      const prices: PricePoint[] = [
        { price: new Decimal(0.7), locked: true },
        { price: new Decimal(0.5), locked: false },
        { price: new Decimal(0.5), locked: false },
      ];

      const newPrices = calcPrices(prices);

      expect(newPrices[0].price.toNumber()).toEqual(0.7);
    });

    test("should split prices evenly so the total is 1", () => {
      const prices: PricePoint[] = [
        { price: new Decimal(0.7), locked: true },
        { price: new Decimal(0.5), locked: false },
        { price: new Decimal(0.5), locked: false },
      ];

      const newPrices = calcPrices(prices);

      expect(newPrices[1].price.toNumber()).toEqual(0.15);
      expect(newPrices[2].price.toNumber()).toEqual(0.15);
    });
  });
});
