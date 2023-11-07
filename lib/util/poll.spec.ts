import { describe, expect, test, vi } from "vitest";
import { poll, PollingTimeout } from "./poll";

describe("poll", () => {
  test("should only call input function once if it succeeds", async () => {
    const testFn = vi.fn(async () => {
      return new Promise((resolve) => {
        resolve("foo");
      });
    });

    const res = await poll(testFn, {
      interval: 50,
      timeout: 1000,
    });

    expect(res).toEqual("foo");
    expect(testFn).toHaveBeenCalledTimes(1);
  });

  test("should call function at least twice and timeout", async () => {
    const testFn = vi.fn(async () => {
      throw new Error("1) What");
    });

    const res = await poll(testFn, {
      interval: 1,
      timeout: 100,
    });

    expect(res).toEqual(PollingTimeout);
    expect(testFn).toHaveBeenNthCalledWith(1);
    expect(testFn).toHaveBeenNthCalledWith(2);
  });
});
