import { expect } from "@playwright/test";
import test from "./lib/test";

test.describe("pages open without errors", () => {
  const testRoutes = [
    { path: "/", testId: "indexPage" },
    { path: "/markets", testId: "marketsList" },
    { path: "/liquidity", testId: "liquidityPage" },
  ];

  for (const route of testRoutes) {
    test(`rotue "${route.path}"`, async ({ page, consoleErrors }) => {
      await page.goto(route.path);

      const element = page.getByTestId(route.testId);
      await element.waitFor();
      await page.waitForTimeout(5000);

      expect(consoleErrors.length, `There were errors: ${consoleErrors}`).toBe(
        0,
      );
    });
  }
});
