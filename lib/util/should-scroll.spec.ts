import { shouldScrollTop } from "./should-scroll";

describe("shouldScrollTop", () => {
  test("should return true for index to create page", () => {
    const shouldScroll = shouldScrollTop("/create", "/");
    expect(shouldScroll).toEqual(true);
  });

  test("should return true for market page to liquidity page", () => {
    const shouldScroll = shouldScrollTop("/liquidity", "/markets/12");
    expect(shouldScroll).toEqual(true);
  });

  test("should return false for market page to index page", () => {
    const shouldScroll = shouldScrollTop("/", "/markets/12");
    expect(shouldScroll).toEqual(false);
  });

  test("should return false for pool page to pool list", () => {
    const shouldScroll = shouldScrollTop("/liquidty", "/liquidty/12");
    expect(shouldScroll).toEqual(false);
  });
});
