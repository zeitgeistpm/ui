import { expect } from "@playwright/test";
import test from "./lib/test";
import { isWSX } from "lib/constants";

test.describe("pages open without errors", () => {
  const testRoutes = isWSX
    ? [{ path: "/markets", testId: "marketCard" }]
    : [
        { path: "/", testId: "indexPage" },
        { path: "/markets", testId: "marketCard" },
      ];

  for (const route of testRoutes) {
    test(`rotue "${route.path}"`, async ({ page, consoleErrors }) => {
      await page.goto(route.path);

      const element = page.locator(`[data-testid^=${route.testId}]`).first();
      await element.waitFor();
      await page.waitForLoadState();

      expect(
        consoleErrors.length,
        `There were errors: ${consoleErrors.join(", ")}`,
      ).toBe(0);
    });
  }
});
