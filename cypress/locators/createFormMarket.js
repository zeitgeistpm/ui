class createForm {
  elements = {
    createMarketForm: () => cy.get('[data-test="createMarketForm"]'),
    createMarketHeader: () => cy.contains("h2", "Create Market"),
    marketNameLabel: () => cy.contains("div", "1. Market name"),
    slugField: () => cy.xpath('//input[@name="slug"]'),
    questionLabel: () => cy.contains("div", "2. Market name / Question *"),
    questionField: () => cy.xpath('//input[@name="question"]'),
    tagChoices: () => cy.get('[data-test="tagChoices"]'),
    tagNorthAmerica: () => cy.contains("div", "North America"),
    marketEndsLabel: () => cy.contains("div", "3. Market ends *"),
    marketEndsOption: () => cy.get('[data-test="marketEndField"]'),
    Enddate: () => cy.xpath('//span[normalize-space()="End Date"]'),
    Endblock: () => cy.get('[data-test="blockButton"]'),
    calendericon: () =>
      cy.xpath(
        '//div[@class="w-ztg-40 h-ztg-40 border-l-1 border-sky-600 bg-sky-200 dark:bg-black flex-shrink-0 rounded-r-ztg-5 center cursor-pointer"]//*[name()="svg"]'
      ),
    currentDate: () => cy.get(".rdtToday"),
    outcomesLabel: () => cy.contains("div", "4. Outcomes *"),
    multipleOutcomes: () => cy.contains("div", "Multiple outcomes"),
    outcomesSwitch: () =>
      cy.contains("div", "Multiple outcomes").siblings().eq(0),
    rangeOfOutcomes: () => cy.contains("div", "Range of outcomes"),
    multipleOutcomesInput0: () =>
      cy.xpath('//input[@name="outcomes.multiple-0-name"]'),
    multipleOutcomesTicker0: () =>
      cy.xpath('//input[@name="outcomes.multiple-0-ticker"]'),
    multipleOutcomesInput1: () =>
      cy.xpath('//input[@name="outcomes.multiple-1-name"]'),
    multipleOutcomesTicker1: () =>
      cy.xpath('//input[@name="outcomes.multiple-1-ticker"]'),
    rangeOfOutcomeMinInput: () =>
      cy.xpath('//input[@name="outcomes.range-short"]'),
    rangeOfOutcomeMaxInput: () =>
      cy.xpath('//input[@name="outcomes.range-long"]'),
    rangeOfOutcomeTicker: () =>
      cy.xpath('//input[@name="outcomes.range-ticker"]'),
    oracleLabel: () => cy.contains("div", "5. Oracle *"),
    oracleInput: () => cy.xpath('//input[@name="oracle"]'),
    marketDescriptionLabel: () => cy.contains("div", "6. Market Description"),
    marketDescriptionTextbox: () => cy.xpath('//textarea[@name="description"]'),
    permissionlessLabel: () => cy.contains("div", "Permissionless"),
    permissionlessSwitch: () =>
      cy.contains("div", "Permissionless").siblings().eq(0),
    advisedLabel: () => cy.contains("div", "Advised"),
    liquiditypoolon: () => cy.xpath('//div[normalize-space()="on"]'),
    liquiditypooloff: () => cy.xpath('//div[normalize-space()="off"]'),
    createMarketButton: () => cy.get("[data-test=createMarketSubmitButton]"),
    totalCost: () => cy.contains("span", "0.75"),
    successMessage: () => cy.contains("span", "Success!"),
    infoMessage: () => cy.contains("span", "Info!"),
  };
}
module.exports = new createForm();
