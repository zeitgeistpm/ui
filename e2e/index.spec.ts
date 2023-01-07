import { expect } from "@playwright/test";
import test from "./lib/test";

test("index page banner button navigates to markets page", async ({ page }) => {
  await page.goto("/");

  const bannerButton = page.getByTestId("bannerButton");

  await bannerButton.click();

  const marketsList = page.getByTestId("marketsList");

  await marketsList.waitFor();

  expect(await marketsList.isVisible()).toBeTruthy();
  expect(page.url()).toContain("markets");
});
