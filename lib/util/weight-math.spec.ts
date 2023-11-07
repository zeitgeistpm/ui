import { describe, expect, test } from "vitest";
import Decimal from "decimal.js";
import { calcPrices, calcWeightGivenSpotPrice, PriceLock } from "./weight-math";

describe("weight math", () => {
  describe("integration", () => {
    test("should calculate weights correctly given a new set of prices", () => {
      const ztgWeight = new Decimal(100);
      const tokenAmounts = new Decimal(100);
      const prices: PriceLock[] = [
        { price: new Decimal(0.3333), locked: true },
        { price: new Decimal(0.5), locked: false },
        { price: new Decimal(0.5), locked: false },
      ];

      const newPrices = calcPrices(prices);
      const weights = newPrices.map((price) =>
        calcWeightGivenSpotPrice(
          tokenAmounts,
          ztgWeight,
          tokenAmounts,
          price.price,
        ),
      );

      const totalWeight = weights.reduce(
        (acc, cur) => acc.plus(cur),
        new Decimal(0),
      );
      expect(totalWeight).toEqual(ztgWeight);
      expect(weights[0].toNumber()).toEqual(33.33);
      expect(weights[1].toNumber()).toEqual(33.335);
      expect(weights[2].toNumber()).toEqual(33.335);
    });
  });

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

    test("should calculate weights to match ztg weight", () => {
      const prices: PriceLock[] = [
        { price: new Decimal(0.7), locked: true },
        { price: new Decimal(0.15), locked: false },
        { price: new Decimal(0.15), locked: false },
      ];

      const weights = prices.map((price) =>
        calcWeightGivenSpotPrice(
          tokenAmounts,
          ztgWeight,
          tokenAmounts,
          price.price,
        ),
      );

      const totalWeight = weights.reduce(
        (acc, cur) => acc.plus(cur),
        new Decimal(0),
      );
      expect(totalWeight).toEqual(ztgWeight);
    });
  });

  describe("calcPrices", () => {
    test("should not change locked prices", () => {
      const prices: PriceLock[] = [
        { price: new Decimal(0.7), locked: true },
        { price: new Decimal(0.5), locked: false },
        { price: new Decimal(0.5), locked: false },
      ];

      const newPrices = calcPrices(prices);

      expect(newPrices[0].price.toNumber()).toEqual(0.7);
    });

    test("should split prices evenly so the total is 1", () => {
      const prices: PriceLock[] = [
        { price: new Decimal(0.7), locked: true },
        { price: new Decimal(0.5), locked: false },
        { price: new Decimal(0.5), locked: false },
      ];

      const newPrices = calcPrices(prices);

      expect(newPrices[1].price.toNumber()).toEqual(0.15);
      expect(newPrices[2].price.toNumber()).toEqual(0.15);
    });

    test("should set price to zero if calculated as a negative number", () => {
      const prices: PriceLock[] = [
        { price: new Decimal(1), locked: true },
        { price: new Decimal(0.5), locked: true },
        { price: new Decimal(0.5), locked: false },
      ];

      const newPrices = calcPrices(prices);

      expect(newPrices[2].price.toNumber()).toEqual(0);
    });
  });
});
