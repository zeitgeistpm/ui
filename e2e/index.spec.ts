import { expect } from "@playwright/test";
import { IndexPage } from "./lib/index.page";
import test from "./lib/test";

test.describe("index page", () => {
  test("banner button navigates to markets page", async ({ page }) => {
    const indexPage = new IndexPage(page);
    await indexPage.goto();

    await indexPage.bannerButton.click();

    await page.waitForNavigation();
    expect(page.url()).toContain("/markets");
    expect(page.url()).not.toContain("/markets/");
  });

  test("learn section buttons open in new tab and display correct pages", async ({
    page,
  }) => {
    const indexPage = new IndexPage(page);
    await indexPage.goto();

    const buttons = indexPage.getLearnSectionButtons();
    const buttonCount = await buttons.count();

    expect(buttonCount).toBeGreaterThan(0);

    for (let index = 0; index < buttonCount; index++) {
      const link = buttons.nth(index);

      const href = await link.getAttribute("href");

      const pagePromise = page
        .context()
        .waitForEvent("page", (p) => p.url() === href);
      await link.click();

      const newPage = await pagePromise;
      newPage.close();
    }
  });

  test("popular categories buttons open correct urls", async ({ page }) => {
    test.setTimeout(100000);
    const indexPage = new IndexPage(page);
    await indexPage.goto();

    const buttons = indexPage.popularCategories.getByTestId("category");
    const buttonCount = await buttons.count();

    expect(buttonCount).toBeGreaterThan(0);

    for (let index = 0; index < buttonCount; index++) {
      const button = buttons.nth(index);
      const category = await button.getByTestId("categoryTitle").innerText();

      await button.locator("> div").click();
      await page.waitForNavigation();

      expect(page.url()).toContain(`/markets?tag=${category}`);

      if (index < buttonCount) {
        await indexPage.goto();
        await indexPage.popularCategories.waitFor();
      }
    }
  });
});
