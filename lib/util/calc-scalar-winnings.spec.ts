import { describe, expect, test } from "vitest";
import {
  calcScalarResolvedPrices,
  calcScalarWinnings,
} from "./calc-scalar-winnings";

describe("calcScalarWinnings", () => {
  test("should calculate winnings correctly for short tokens", () => {
    const winnings = calcScalarWinnings(0, 10, 5, 100, 0);
    expect(winnings.toNumber()).toEqual(50);
  });

  test("should calculate winnings correctly for long tokens", () => {
    const winnings = calcScalarWinnings(0, 40, 10, 0, 100);
    expect(winnings.toNumber()).toEqual(25);
  });

  test("should calculate winnings correctly for both long and short tokens", () => {
    const winnings = calcScalarWinnings(0, 40, 10, 100, 100);
    expect(winnings.toNumber()).toEqual(100);
  });

  test("long value should be capped at 1 if resolved outcome is outside of bounds", () => {
    const { longTokenValue } = calcScalarResolvedPrices(0, 40, 50);
    expect(longTokenValue.toNumber()).toEqual(1);
  });

  test("long value should not fall below 0 if resolved outcome is outside of bounds", () => {
    const { longTokenValue } = calcScalarResolvedPrices(10, 40, 0);
    expect(longTokenValue.toNumber()).toEqual(0);
  });

  test("short value should not fall below 0 if resolved outcome is outside of bounds", () => {
    const { shortTokenValue } = calcScalarResolvedPrices(0, 40, 50);
    expect(shortTokenValue.toNumber()).toEqual(0);
  });

  test("short value should be capped at 1 resolved outcome is outside of bounds", () => {
    const { shortTokenValue } = calcScalarResolvedPrices(10, 40, 0);
    expect(shortTokenValue.toNumber()).toEqual(1);
  });
});
