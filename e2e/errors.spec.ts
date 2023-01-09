import { expect } from "@playwright/test";
import test from "./lib/test";

test.describe("pages open without errors", () => {
  const testRoutes = [
    { path: "/", testId: "indexPage" },
    { path: "/markets", testId: "marketCard" },
    { path: "/liquidity", testId: "liquidityTable" },
  ];

  for (const route of testRoutes) {
    test(`rotue "${route.path}"`, async ({ page, consoleErrors }) => {
      await page.goto(route.path);

      const element = page.locator(`[data-testid^=${route.testId}]`).first();
      await element.waitFor();

      expect(consoleErrors.length, `There were errors: ${consoleErrors}`).toBe(
        0,
      );
    });
  }
});
