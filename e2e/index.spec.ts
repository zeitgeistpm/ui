import { expect } from "@playwright/test";
import { IndexPage } from "./lib/index.page";
import test from "./lib/test";

test.describe("index page", () => {
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

  test("learn section corresponds the snapshot", async ({ page }) => {
    const indexPage = new IndexPage(page);
    await indexPage.goto();

    expect(await indexPage.learnSection.screenshot()).toMatchSnapshot(
      "learnSection.png",
    );
  });

  test("hero slider chages a slide", async ({ page }) => {
    const indexPage = new IndexPage(page);
    await indexPage.goto();

    const { heroSlider } = indexPage;

    const prevButton = heroSlider.locator("button").first();
    const nextButton = heroSlider.locator("button").last();

    const images = await heroSlider.locator("> img").all();

    const hasButtons =
      (await prevButton.isVisible()) && (await nextButton.isVisible());

    if (images.length === 1) {
      console.log("Hero slider has only one slide");
      expect(hasButtons).toBe(false);
    } else {
      expect(hasButtons).toBe(true);

      const numSlides = images.length;

      let lastTitle: string | null = null;
      let lastSubTitle: string | null = null;
      for (let index = 0; index < numSlides; index++) {
        expect(await indexPage.getActiveSlideIndex()).toBe(index);
        const title = await heroSlider.locator("h2").last().textContent();
        const subTitle = await heroSlider.locator("p").last().textContent();
        if (index > 0) {
          expect(title).not.toBe(lastTitle);
          expect(subTitle).not.toBe(lastSubTitle);
        } else {
          lastTitle = title;
          lastSubTitle = subTitle;
        }
        await nextButton.click();
      }

      for (let index = numSlides - 1; index === numSlides; index--) {
        expect(await indexPage.getActiveSlideIndex()).toBe(index);
        const title = await heroSlider.locator("h2").last().textContent();
        const subTitle = await heroSlider.locator("p").last().textContent();
        if (index < numSlides - 1) {
          expect(title).not.toBe(lastTitle);
          expect(subTitle).not.toBe(lastSubTitle);
        } else {
          lastTitle = title;
          lastSubTitle = subTitle;
        }
        await prevButton.click();
      }
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

      expect(page.url()).toContain(`/markets?status=Active&tag=${category}`);

      if (index < buttonCount) {
        await indexPage.goto();
        await indexPage.popularCategories.waitFor();
      }
    }
  });
});
