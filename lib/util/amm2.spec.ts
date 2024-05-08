import { describe, expect, test } from "vitest";
import Decimal from "decimal.js";
import {
  calculateSpotPrice,
  approximateMaxAmountInForBuy,
  calculateSwapAmountOutForBuy,
  calculateSwapAmountOutForSell,
  calculatePoolAmounts,
  isValidBuyAmount,
  isValidSellAmount,
  calculateReserveAfterSell,
  calculateSpotPriceAfterBuy,
  calculateSpotPriceAfterSell,
} from "./amm2";
import { ZTG } from "@zeitgeistpm/sdk";

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

    test("should work with fees", () => {
      const amountOut = calculateSwapAmountOutForBuy(
        new Decimal(1_000_000_000_000),
        new Decimal(109_270_000_000),
        new Decimal(1_442_695_040_889),
        new Decimal(0.03),
        new Decimal(0.005),
      );

      expect(amountOut.toFixed(0)).toEqual("203706311364");
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

  describe("calculateSpotPriceAfterBuy", () => {
    test("should work", () => {
      const spotPrice = calculateSpotPriceAfterBuy(
        new Decimal(59.00001516623987),
        new Decimal(144.00003701590745),
        new Decimal(543.3339883933237),
        new Decimal(486),
      );

      expect(spotPrice.toNumber()).toEqual(0.98849704337919602199);
    });
  });
  describe("calculateSpotPriceAfterSell", () => {
    test("should work", () => {
      const spotPrice = calculateSpotPriceAfterSell(
        new Decimal(99.0),
        new Decimal(108.04431012579187),
        new Decimal(40),
        new Decimal(14.27511827415865),
      );

      expect(spotPrice.toFixed(8)).toEqual("0.31525092");
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

  describe("calculatePoolAmounts", () => {
    test("should work for even prices for binary markets", () => {
      const amounts = calculatePoolAmounts(new Decimal(100 * 10 ** 10), [
        new Decimal(0.5),
        new Decimal(0.5),
      ]);

      expect(amounts[0].toNumber()).toEqual(100_0000000000);
      expect(amounts[1].toNumber()).toEqual(100_0000000000);
    });

    test("should work for even prices for multi markets", () => {
      const amounts = calculatePoolAmounts(new Decimal(100 * 10 ** 10), [
        new Decimal(0.33),
        new Decimal(0.33),
        new Decimal(0.33),
      ]);

      expect(amounts[0].toNumber()).toEqual(100_0000000000);
      expect(amounts[1].toNumber()).toEqual(100_0000000000);
      expect(amounts[2].toNumber()).toEqual(100_0000000000);
    });

    test("should work for uneven prices for binary markets", () => {
      const amounts = calculatePoolAmounts(new Decimal(100 * 10 ** 10), [
        new Decimal(0.3),
        new Decimal(0.7),
      ]);

      expect(amounts[0].toFixed(0)).toEqual("1000000000000");
      expect(amounts[1].toFixed(0)).toEqual("296248339379");
    });

    test("should work for uneven prices for binary markets 2", () => {
      const amounts = calculatePoolAmounts(new Decimal(100 * 10 ** 10), [
        new Decimal(0.9),
        new Decimal(0.1),
      ]);

      expect(amounts[0].toFixed(0)).toEqual("45757490561");
      expect(amounts[1].toFixed(0)).toEqual("1000000000000");
    });

    test("should work for uneven prices for multi markets 2", () => {
      const amounts = calculatePoolAmounts(new Decimal(100 * 10 ** 10), [
        new Decimal(0.3),
        new Decimal(0.1),
        new Decimal(0.6),
      ]);

      expect(amounts[0].toFixed(0)).toEqual("522878745280");
      expect(amounts[1].toFixed(0)).toEqual("1000000000000");
      expect(amounts[2].toFixed(0)).toEqual("221848749616");
    });
  });

  describe("isValidBuyAmount", () => {
    test("should return true if amount in is allowed", () => {
      const { isValid, message } = isValidBuyAmount(
        new Decimal(10 * 10 ** 10),
        new Decimal(10 * 10 ** 10),
        new Decimal(144269504088),
        new Decimal(0),
        new Decimal(0),
      );

      expect(isValid).toEqual(true);
      expect(message).toEqual(undefined);
    });

    test("should return false if amount in is too high", () => {
      const { isValid, message } = isValidBuyAmount(
        new Decimal(10 * 10 ** 10),
        new Decimal(10000 * 10 ** 10),
        new Decimal(144269504088),
        new Decimal(0),
        new Decimal(0),
      );

      expect(isValid).toEqual(false);
      expect(message).toEqual("Amount in too high");
    });

    test("should return false if amount in is too low", () => {
      const { isValid, message } = isValidBuyAmount(
        new Decimal(100 * 10 ** 10),
        new Decimal(1 * 10 ** 10),
        new Decimal(144269504088),
        new Decimal(0),
        new Decimal(0),
      );

      expect(isValid).toEqual(false);
      expect(message).toEqual("Amount in too low");
    });
  });

  describe("isValidSellAmount", () => {
    test("should return true if amount in is allowed", () => {
      const { isValid, message } = isValidSellAmount(
        new Decimal(10 * 10 ** 10),
        new Decimal(10 * 10 ** 10),
        new Decimal(144269504088),
      );

      expect(isValid).toEqual(true);
      expect(message).toEqual(undefined);
    });

    test("should return false if amount in is too high ", () => {
      const { isValid, message } = isValidSellAmount(
        new Decimal(10 * 10 ** 10),
        new Decimal(10000 * 10 ** 10),
        new Decimal(144269504088),
      );

      expect(isValid).toEqual(false);
      expect(message).toEqual("Amount in too high");
    });

    test("should return false if price is too low", () => {
      const { isValid, message } = isValidSellAmount(
        new Decimal(1000 * 10 ** 10),
        new Decimal(10 * 10 ** 10),
        new Decimal(144269504088),
      );

      expect(isValid).toEqual(false);
      expect(message).toEqual("Price is low to sell");
    });
  });

  describe("calculateReserveAfterSell", () => {
    test("should work", () => {
      const newReserve = calculateReserveAfterSell(
        new Decimal(10 * 10 ** 10),
        new Decimal(10 * 10 ** 10),
        new Decimal(144269504088),
      );

      expect(newReserve.div(ZTG).toFixed(3)).toEqual("15.850");
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
