import { describe, expect, test } from "vitest";
import { calcInGivenOut, calcOutGivenIn, calcSpotPrice } from "./math";

describe("math", () => {
  describe("calcSpotPrice", () => {
    test("should calculate 1 with a balanced pool", () => {
      const spotPrice = calcSpotPrice(50, 50, 50, 50, 0);

      expect(spotPrice.toNumber()).toEqual(1);
    });

    test("should calculate correctly with a balanced pool and fees", () => {
      const spotPrice = calcSpotPrice(50, 50, 50, 50, 0.01);

      expect(spotPrice.toSignificantDigits(5).toNumber()).toEqual(1.0101);
    });
  });

  describe("calcOutGivenIn", () => {
    describe("without creator fees", () => {
      test("should calculate correctly", () => {
        const out = calcOutGivenIn(50, 50, 50, 50, 25, 0, 0);

        expect(out.toFixed(1)).toEqual("16.7");
      });

      test("should calculate correctly with fees", () => {
        const out = calcOutGivenIn(50, 50, 50, 50, 25, 0.1, 0);

        expect(out.toFixed(1)).toEqual("15.5");
      });
    });

    describe("with creator fees", () => {
      test("should calculate correctly", () => {
        const out = calcOutGivenIn(50, 50, 50, 50, 25, 0.01, 0.01);

        expect(out.toFixed(1)).toEqual("16.4");
      });
    });
  });

  describe("calcInGivenOut", () => {
    describe("without creator fees", () => {
      test("should calculate correctly", () => {
        const amountIn = calcInGivenOut(50, 50, 50, 50, 10, 0, 0);

        expect(amountIn.toFixed(1)).toEqual("12.5");
      });

      test("should calculate correctly with fees", () => {
        const amountIn = calcInGivenOut(50, 50, 50, 50, 10, 0.05, 0);

        expect(amountIn.toFixed(1)).toEqual("13.2");
      });
    });

    describe("with creator fees", () => {
      test("should calculate correctly", () => {
        const amountIn = calcInGivenOut(50, 50, 50, 50, 10, 0.01, 0.01);

        expect(amountIn.toFixed(1)).toEqual("12.8");
      });
    });
  });
});
