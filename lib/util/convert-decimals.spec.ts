import { describe, expect, test } from "vitest";
import Decimal from "decimal.js";
import { convertDecimals } from "./convert-decimals";

describe("convertDecimals", () => {
  test("should scale number down", () => {
    const amount = convertDecimals(new Decimal(1000), 12, 10);

    expect(amount.toString()).toEqual("10");
  });

  test("should scale number up", () => {
    const amount = convertDecimals(new Decimal(1000), 10, 12);

    expect(amount.toString()).toEqual("100000");
  });

  test("should do nothing", () => {
    const amount = convertDecimals(new Decimal(1000), 10, 10);

    expect(amount.toString()).toEqual("1000");
  });
});
