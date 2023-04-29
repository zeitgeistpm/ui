import { Locator, Page } from "@playwright/test";

export class IndexPage {
  readonly learnSection: Locator;
  readonly popularCategories: Locator;
  readonly heroSlider: Locator;

  constructor(public readonly page: Page) {
    this.learnSection = page.getByTestId("learnSection");
    this.popularCategories = page.getByTestId("popularCategories");
    this.heroSlider = page.getByTestId("HeroSlider__container");
  }

  async goto() {
    await this.page.goto("/");
  }

  getLearnSectionButtons(): Locator {
    return this.learnSection.locator("a");
  }

  async getActiveSlideIndex(): Promise<number> {
    const images = await this.heroSlider.locator("> img").all();
    for (const [index, image] of images.entries()) {
      const opacity = await image.evaluate((node) => {
        return node.style.opacity;
      });
      const isVisible = opacity === "1";
      if (isVisible) {
        return index;
      }
    }
    return -1;
  }
}
