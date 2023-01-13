import { Locator, Page } from "@playwright/test";

export class IndexPage {
  readonly bannerButton: Locator;
  readonly learnSection: Locator;
  readonly popularCategories: Locator;

  constructor(public readonly page: Page) {
    this.bannerButton = page.getByTestId("bannerButton");
    this.learnSection = page.getByTestId("learnSection");
    this.popularCategories = page.getByTestId("popularCategories");
  }

  async goto() {
    await this.page.goto("/");
  }

  getLearnSectionButtons(): Locator {
    return this.learnSection.locator("a");
  }
}
