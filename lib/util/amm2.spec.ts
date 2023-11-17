import { describe, expect, test } from "vitest";
import Decimal from "decimal.js";
import {
  calculateSpotPrice,
  approximateMaxAmountInForBuy,
  calculateSwapAmountOutForBuy,
  calculateSwapAmountOutForSell,
} from "./amm2";

// test cases copied from https://github.com/zeitgeistpm/zeitgeist/blob/f0586d32c692f738b04d03bec4e59a73d6899182/zrml/neo-swaps/src/math.rs
describe("amm2", () => {
  describe("calculateSwapAmountOutForBuy", () => {
    test("should work", () => {
      const amountOut = calculateSwapAmountOutForBuy(
        new Decimal(10 * 10 ** 10),
        new Decimal(10 * 10 ** 10),
        new Decimal(144269504088),
        new Decimal(0),
        new Decimal(0),
      );

      expect(amountOut.toFixed(0)).toEqual("158496250072");
    });
  });

  describe("calculateSwapAmountOutForSell", () => {
    test("should work", () => {
      const amountOut = calculateSwapAmountOutForSell(
        new Decimal(10 * 10 ** 10),
        new Decimal(10 * 10 ** 10),
        new Decimal(144269504088),
        new Decimal(0),
        new Decimal(0),
      );

      expect(amountOut.toFixed(0)).toEqual("41503749928");
    });
  });

  describe("calculateSpotPrice", () => {
    test("should work 1", () => {
      const amountOut = calculateSpotPrice(
        new Decimal(10 * 10 ** 10),
        new Decimal(144269504088),
      );

      expect(amountOut.toFixed(5)).toEqual("0.50000");
    });

    test("should work 2", () => {
      const amountOut = calculateSpotPrice(
        new Decimal(10 * 10 ** 10).minus(58496250072),
        new Decimal(144269504088),
      );

      expect(amountOut.toFixed(5)).toEqual("0.75000");
    });

    test("should work 3", () => {
      const amountOut = calculateSpotPrice(
        new Decimal(20 * 10 ** 10),
        new Decimal(144269504088),
      );

      expect(amountOut.toFixed(5)).toEqual("0.25000");
    });
  });

  describe("approximateMaxAmountInForBuy", () => {
    //seems like correct number would be 41
    test("should work", () => {
      const amountOut = approximateMaxAmountInForBuy(
        new Decimal(59_9567744280),
        new Decimal(144_2695040889),
      );

      expect(amountOut.toFixed(0)).toEqual("4867389110738");
    });
  });

  test("all functions", () => {
    const liquidity = new Decimal(144.00003701590745);
    const reserves = [
      new Decimal(59.00001516623987),
      new Decimal(156.98193508578956),
    ];
    const spotPrices = [0.6638346230341853, 0.33616537696581467];
    const amountIn = new Decimal(486);

    const amountOut = calculateSwapAmountOutForBuy(
      reserves[0],
      amountIn,
      liquidity,
      new Decimal(0),
      new Decimal(0),
    );
    const poolAmountOut = amountOut.minus(amountIn);
    const newReserve = reserves[0].minus(poolAmountOut);
    const newSpotPrice = calculateSpotPrice(newReserve, liquidity);

    expect(amountOut.toFixed(5)).toEqual("543.33399");
    expect(poolAmountOut.toFixed(5)).toEqual("57.33399");
    expect(newReserve.toFixed(5)).toEqual("1.66603");
    expect(newSpotPrice.toFixed(5)).toEqual("0.98850");
  });
});
