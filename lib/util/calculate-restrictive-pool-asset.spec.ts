import { describe, expect, test } from "vitest";
import { calculateRestrictivePoolAsset } from "./calculate-restrictive-pool-asset";
import Decimal from "decimal.js";

describe("calculateRestrictivePoolAsset", () => {
  test("should work with 2 asset and an even pool", () => {
    const index = calculateRestrictivePoolAsset(
      [new Decimal(100), new Decimal(100)],
      [new Decimal(100), new Decimal(10)],
    );

    expect(index).toEqual(1);
  });

  test("should work with 3 assets and an even pool", () => {
    const index = calculateRestrictivePoolAsset(
      [new Decimal(100), new Decimal(100), new Decimal(100)],
      [new Decimal(5), new Decimal(100), new Decimal(100)],
    );

    expect(index).toEqual(0);
  });

  test("should work with 3 assets and an uneven pool but even balances", () => {
    const index = calculateRestrictivePoolAsset(
      [new Decimal(50), new Decimal(100), new Decimal(200)],
      [new Decimal(100), new Decimal(100), new Decimal(100)],
    );

    expect(index).toEqual(2);
  });

  test("should default to index 0 if everything is even", () => {
    const index = calculateRestrictivePoolAsset(
      [new Decimal(100), new Decimal(100)],
      [new Decimal(100), new Decimal(100)],
    );

    expect(index).toEqual(2);
  });

  test("should default to index 0 if everything is restrictive because the user balances are larger that the pool balances", () => {
    const index = calculateRestrictivePoolAsset(
      [new Decimal(259_6623455249), new Decimal(26_0713482736)],
      [new Decimal(377_7663444170), new Decimal(435_6197876384)],
    );

    expect(index).toEqual(0);
  });
});
