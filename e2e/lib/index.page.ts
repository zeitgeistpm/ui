import { Locator, Page } from "@playwright/test";

export class IndexPage {
  readonly learnSection: Locator;
  readonly popularCategories: Locator;
  readonly heroSlider: Locator;

  constructor(public readonly page: Page) {
    this.learnSection = page.getByTestId("learnSection");
    this.popularCategories = page.getByTestId("popularCategories");
    this.heroSlider = page.getByTestId("heroSlider");
  }

  async goto() {
    await this.page.goto("/");
  }

  getLearnSectionButtons(): Locator {
    return this.learnSection.locator("a");
  }
}
