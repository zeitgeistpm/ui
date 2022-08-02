declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to select DOM element by data-test attribute.
     */
    getTestElement<K extends keyof HTMLElementTagNameMap>(
      attributeVal: string,
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
  }
}
