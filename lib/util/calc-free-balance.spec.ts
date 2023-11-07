import { describe, expect, test } from "vitest";
import { calculateFreeBalance } from "./calc-free-balance";

describe("calculateFreeBalance", () => {
  test("should return free when nothing is frozen", () => {
    const free = calculateFreeBalance("100", "0", "0");
    expect(free.toString()).toEqual("100");
  });

  test("should negate the max of misc and fee frozen", () => {
    const free = calculateFreeBalance("100", "20", "10");
    expect(free.toString()).toEqual("80");
  });
});
