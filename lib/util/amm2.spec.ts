import Decimal from "decimal.js";
import {
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

      expect(amountOut.toFixed(0)).toEqual("58496250072");
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
});
