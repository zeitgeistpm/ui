import createForm from "../locators/createFormMarket.js";
import CreateMarket from "../fixtures/createMarket.json";
import marketPage from "../locators/marketPage.js";

describe("Create market page", () => {
  beforeEach(() => {
    window.localStorage.setItem("endpoint-1", '"ws://127.0.0.1:9944"');
    window.localStorage.setItem(
      "gql-endpoint-1",
      '"http://localhost:4350/graphql"'
    );
    window.localStorage.setItem("walletId", '"polkadot-js"');
    cy.visit("http://localhost:3000/create");
    cy.window().its("ACTIVE_ACCOUNT_ADDRESS").should("not.be.undefined");
    cy.window().then((win) => {
      const accountAddress = win.ACTIVE_ACCOUNT_ADDRESS;

      cy.wrap(accountAddress).as("accountAddress");
    });
  });
  it("Verify create market form is loaded", () => {
    createForm.elements.createMarketForm().should("be.visible");
    createForm.elements.createMarketHeader().should("be.visible");
    createForm.elements.marketNameLabel().should("be.visible");
    createForm.elements.slugField().should("be.visible");
    createForm.elements.questionLabel().should("be.visible");
    createForm.elements.questionField().should("be.visible");
    createForm.elements.tagChoices().should("be.visible");
    createForm.elements.marketEndsLabel().should("be.visible");
    createForm.elements.marketEndsOption().should("be.visible");
    createForm.elements.outcomesLabel().scrollIntoView().should("be.visible");
    createForm.elements.oracleLabel().should("be.visible");
    createForm.elements.oracleInput().should("be.visible");
    createForm.elements.marketDescriptionLabel().should("be.visible");
    createForm.elements.marketDescriptionTextbox().should("be.visible");
    createForm.elements
      .permissionlessLabel()
      .scrollIntoView()
      .should("be.visible");
    createForm.elements.advisedLabel().should("be.visible");
    createForm.elements.createMarketButton().should("be.visible");
  });
  it("Verify switch button is working for multiple outcomes and range of outcomes", () => {
    createForm.elements
      .outcomesSwitch()
      .eq(0)
      .scrollIntoView()
      .should("be.visible")
      .click();
    createForm.elements.rangeOfOutcomeMinInput().should("be.visible");
    createForm.elements.rangeOfOutcomeMaxInput().should("be.visible");
    createForm.elements.rangeOfOutcomeTicker().should("be.visible");
  });
  it("Verify when the switch button is clicked again, then categorical market inputs are visible", () => {
    createForm.elements
      .outcomesSwitch()
      .eq(0)
      // .scrollIntoView()
      // .should("be.visible")
      .click();
    createForm.elements
      .outcomesSwitch()
      .eq(0)
      // .scrollIntoView()
      // .should("be.visible")
      .click();
    createForm.elements.multipleOutcomesInput0().eq(0).should("be.visible");
    createForm.elements.multipleOutcomesTicker0().eq(0).should("be.visible");
    createForm.elements.multipleOutcomesInput1().eq(1).should("be.visible");
    createForm.elements.multipleOutcomesTicker1().eq(1).should("be.visible");
  });
  it("Verify switch button is working for permission-less and Advised", () => {
    createForm.elements
      .permissionlessSwitch()
      .eq(1)
      // .scrollIntoView()
      // .should("be.visible")
      .click();
    createForm.elements.totalCost().should("be.visible");
  });
  it("Verify switch button is working when clicked again for permission-less and advised", () => {
    createForm.elements
      .permissionlessSwitch()
      .eq(1)
      // .scrollIntoView()
      // .should("be.visible")
      .click();
    createForm.elements
      .permissionlessSwitch()
      .eq(1)
      // .scrollIntoView()
      // .should("be.visible")
      .click();
  });
  context("When user does not enters required fields", () => {
    it("Verify create button is disabled", () => {
      createForm.elements
        .createMarketButton()
        .scrollIntoView()
        .should("be.visible")
        .and("be.disabled");
    });
  });
  context("When user enters required fields", () => {
    it("Verify create button is not disabled", () => {
      createForm.elements
        .slugField()
        .should("be.visible")
        .type(CreateMarket.slug);
      createForm.elements
        .questionField()
        .should("be.visible")
        .type(CreateMarket.MarketDescription);
      createForm.elements
        .multipleOutcomesInput0()
        .eq(0)
        .should("be.visible")
        .type(CreateMarket.Multiple_outcomes_input0);
      createForm.elements
        .multipleOutcomesTicker0()
        .eq(0)
        .should("be.visible")
        .type(CreateMarket.Multipleoutcometicker0);
      createForm.elements
        .multipleOutcomesInput1()
        .eq(1)
        .should("be.visible")
        .type(CreateMarket.Multiple_outcomes_input1);
      createForm.elements
        .multipleOutcomesTicker1()
        .eq(1)
        .should("be.visible")
        .type(CreateMarket.Multipleoutcometicker1);
      cy.get("@accountAddress").then((oracleInput) => {
        createForm.elements.oracleInput().type(oracleInput);
      });
      createForm.elements.createMarketButton().should("be.visible");
    });
  });
  // This context is commented for now as there are always funds present in our wallet
  // context('When user has insufficient funds',()=> {
  //   it('Verify user is unable to create a market', () => {
  //     createForm.elements.slugField()
  //     .type(CreateMarket.slug)
  //     createForm.elements.questionField()
  //     .type(CreateMarket.Marketquestion)
  //     createForm.elements.tagChoices()
  //     .should('be.visible'),
  //     createForm.elements.tagNorthAmerica()
  //     .click()
  //     createForm.elements.marketEndsLabel()
  //     .should('be.visible')
  //     createForm.elements.marketEndsOption()
  //     .should('be.visible')
  //     createForm.elements.calendericon()
  //     .should('be.visible')
  //     .click()
  //     createForm.elements.currentDate().next()
  //     .should('be.visible')
  //     .click()
  //     createForm.elements.outcomesLabel()
  //     .click({force: true})
  //     createForm.elements.multipleOutcomes()
  //     .scrollIntoView()
  //     .should('be.visible')
  //     .click()
  //     createForm.elements.multipleOutcomesInput0().eq(0)
  //     .type(CreateMarket.Multiple_outcomes_input0)
  //     createForm.elements.multipleOutcomesTicker0().eq(0)
  //     .type(CreateMarket.Multipleoutcometicker0)
  //     createForm.elements .multipleOutcomesInput1().eq(1)
  //     .type(CreateMarket.Multiple_outcomes_input1)
  //     createForm.elements.multipleOutcomesTicker1().eq(1)
  //     .type(CreateMarket.Multipleoutcometicker1)
  //     createForm.elements.oracleLabel()
  //     .should('be.visible')
  //     createForm.elements.oracleInput()
  //     .type(cy.get(oracleInput))
  //     createForm.elements.marketDescriptionLabel()
  //     .should('be.visible')
  //     createForm.elements.marketDescriptionTextbox()
  //     .type(CreateMarket.MarketDescription)
  //     createForm.elements.createMarketButton()
  //     .should('be.visible')
  //     .and('be.disabled')
  //   });
  // })
  context("When user has sufficient funds", () => {
    it("Verify user is able to create market with multiple outcomes-permissionless-with LiquidityPool", () => {
      createForm.elements.slugField().type(CreateMarket.slug);
      createForm.elements.questionField().type(CreateMarket.Marketquestion);
      createForm.elements.tagChoices().should("be.visible"),
        createForm.elements.tagNorthAmerica().eq(1).click();
      createForm.elements.marketEndsLabel().should("be.visible");
      createForm.elements.marketEndsOption().should("be.visible");
      createForm.elements
        .multipleOutcomes()
        // .scrollIntoView()
        // .should("be.visible")
        .click();
      // createForm.elements.outcomesSwitch().eq(0)
      // .click()
      createForm.elements
        .multipleOutcomesInput0()
        .eq(0)
        .type(CreateMarket.Multiple_outcomes_input0);
      createForm.elements
        .multipleOutcomesTicker0()
        .eq(0)
        .type(CreateMarket.Multipleoutcometicker0);
      createForm.elements
        .multipleOutcomesInput1()
        .eq(1)
        .type(CreateMarket.Multiple_outcomes_input1);
      createForm.elements
        .multipleOutcomesTicker1()
        .eq(1)
        .type(CreateMarket.Multipleoutcometicker1);
      createForm.elements.oracleLabel().should("be.visible");
      cy.get("@accountAddress").then((oracleInput) =>
        createForm.elements.oracleInput().type(oracleInput)
      );

      createForm.elements.marketDescriptionLabel().should("be.visible");
      createForm.elements
        .marketDescriptionTextbox()
        .type(CreateMarket.MarketDescription);
      // createForm.elements.permissionlessSwitch().eq(1)
      // .click()
      // createForm.elements.permissionlessLabel()
      // .should('be.visible')
      // .and('have.css','color','rgb(0,0,0,var(--tw-text-opacity))')
      createForm.elements.liquiditypoolon().eq(0).click();
      createForm.elements
        .createMarketButton()
        .should("be.visible")
        .and("not.be.disabled")
        .click();
      createForm.elements.notificationMessage().should("contain", "Info!");
      createForm.elements.notificationMessage().should("contain", "Success!");
      marketPage.elements
        .TokenText()
        .eq(0)
        .contains(CreateMarket.Multipleoutcometicker0);
      marketPage.elements
        .OutcomeText()
        .eq(0)
        .contains(CreateMarket.Multiple_outcomes_input0);
      marketPage.elements
        .TokenText()
        .eq(1)
        .contains(CreateMarket.Multipleoutcometicker1);
      marketPage.elements
        .OutcomeText()
        .eq(1)
        .contains(CreateMarket.Multiple_outcomes_input1);
      marketPage.elements
        .InspectButton()
        .eq(0)
        .scrollIntoView()
        .should("be.visible")
        .click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
      marketPage.elements
        .InspectButton()
        .eq(1)
        .scrollIntoView()
        .should("be.visible")
        .click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
    });
    it("Verify user is able to create market with multiple outcomes-permissionless-without LiquidityPool", () => {
      createForm.elements.slugField().type(CreateMarket.slug);
      createForm.elements.questionField().type(CreateMarket.Marketquestion);
      createForm.elements.tagChoices().should("be.visible"),
        createForm.elements.tagNorthAmerica().eq(1).click();
      createForm.elements.marketEndsLabel().should("be.visible");
      createForm.elements.marketEndsOption().should("be.visible");
      createForm.elements
        .multipleOutcomes()
        .scrollIntoView()
        .should("be.visible")
        .click();
      // createForm.elements.outcomesSwitch().eq(0)
      // .click()
      createForm.elements
        .multipleOutcomesInput0()
        .eq(0)
        .type(CreateMarket.Multiple_outcomes_input0);
      createForm.elements
        .multipleOutcomesTicker0()
        .eq(0)
        .type(CreateMarket.Multipleoutcometicker0);
      createForm.elements
        .multipleOutcomesInput1()
        .eq(1)
        .type(CreateMarket.Multiple_outcomes_input1);
      createForm.elements
        .multipleOutcomesTicker1()
        .eq(1)
        .type(CreateMarket.Multipleoutcometicker1);
      createForm.elements.oracleLabel().should("be.visible");
      cy.get("@accountAddress").then((oracleInput) =>
        createForm.elements.oracleInput().type(oracleInput)
      );
      createForm.elements.marketDescriptionLabel().should("be.visible");
      createForm.elements
        .marketDescriptionTextbox()
        .type(CreateMarket.MarketDescription);
      // createForm.elements.permissionlessSwitch().eq(1)
      // .click()
      // createForm.elements.permissionlessLabel()
      // .should('be.visible')
      // .and('have.css','color','rgb(0,0,0,var(--tw-text-opacity))')
      // createForm.elements.liquiditypoolon()
      // .click()
      createForm.elements
        .createMarketButton()
        .should("be.visible")
        .and("not.be.disabled")
        .click();
      createForm.elements.notificationMessage().should("be.visible");
      createForm.elements.notificationMessage().should("be.visible");
      marketPage.elements.LiquidityPoolMessage().should("be.visible");
      marketPage.elements
        .TokenText()
        .eq(0)
        .contains(CreateMarket.Multipleoutcometicker0);
      marketPage.elements
        .OutcomeText()
        .eq(0)
        .contains(CreateMarket.Multiple_outcomes_input0);
      marketPage.elements
        .TokenText()
        .eq(1)
        .contains(CreateMarket.Multipleoutcometicker1);
      marketPage.elements
        .OutcomeText()
        .eq(1)
        .contains(CreateMarket.Multiple_outcomes_input1);
      marketPage.elements.LiquidityButton().should("be.visible");
      //.click()
      marketPage.elements.InspectButton().eq(0).should("be.visible").click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
      marketPage.elements.InspectButton().eq(1).should("be.visible").click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
    });
    it("Verify user is able to create market with multiple outcomes- advised market", () => {
      createForm.elements.slugField().type(CreateMarket.slug);
      createForm.elements.questionField().type(CreateMarket.Marketquestion);
      createForm.elements.tagChoices().should("be.visible"),
        createForm.elements.tagNorthAmerica().eq(1).click();
      createForm.elements.marketEndsLabel().should("be.visible");
      createForm.elements.marketEndsOption().should("be.visible");
      createForm.elements
        .multipleOutcomes()
        .scrollIntoView()
        .should("be.visible")
        .click();
      createForm.elements
        .multipleOutcomesInput0()
        .eq(0)
        .type(CreateMarket.Multiple_outcomes_input0);
      createForm.elements
        .multipleOutcomesTicker0()
        .eq(0)
        .type(CreateMarket.Multipleoutcometicker0);
      createForm.elements
        .multipleOutcomesInput1()
        .eq(1)
        .type(CreateMarket.Multiple_outcomes_input1);
      createForm.elements
        .multipleOutcomesTicker1()
        .eq(1)
        .type(CreateMarket.Multipleoutcometicker1);
      createForm.elements.oracleLabel().should("be.visible");
      cy.get("@accountAddress").then((oracleInput) => {
        createForm.elements.oracleInput().type(oracleInput);
      });
      createForm.elements.marketDescriptionLabel().should("be.visible");
      createForm.elements
        .marketDescriptionTextbox()
        .type(CreateMarket.MarketDescription);
      createForm.elements.permissionlessSwitch().eq(1).click();
      createForm.elements.advisedLabel().should("be.visible");
      createForm.elements
        .createMarketButton()
        .should("be.visible")
        .and("not.be.disabled")
        .click();
      createForm.elements.notificationMessage().should("be.visible");
      createForm.elements.notificationMessage().should("be.visible");
      marketPage.elements.LiquidityPoolMessage().should("be.visible");
      marketPage.elements
        .TokenText()
        .eq(0)
        .contains(CreateMarket.Multipleoutcometicker0);
      marketPage.elements
        .OutcomeText()
        .eq(0)
        .contains(CreateMarket.Multiple_outcomes_input0);
      marketPage.elements
        .TokenText()
        .eq(1)
        .contains(CreateMarket.Multipleoutcometicker1);
      marketPage.elements
        .OutcomeText()
        .eq(1)
        .contains(CreateMarket.Multiple_outcomes_input1);
      marketPage.elements.InspectButton().eq(0).should("be.visible").click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
      marketPage.elements.InspectButton().eq(1).should("be.visible").click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
    });
    it("Verify user is able to create market with range of outcomes-permissionless-with LiquidityPool", () => {
      createForm.elements.slugField().type(CreateMarket.slug);
      createForm.elements.questionField().type(CreateMarket.Marketquestion);
      createForm.elements.tagChoices().should("be.visible"),
        createForm.elements.tagNorthAmerica().eq(1).click();
      createForm.elements.marketEndsLabel().should("be.visible");
      createForm.elements.marketEndsOption().should("be.visible");
      createForm.elements
        .outcomesSwitch()
        .eq(0)
        .scrollIntoView()
        .should("be.visible")
        .click();
      // createForm.elements.rangeOfOutcomes()
      // .should('be.visible')
      createForm.elements
        .rangeOfOutcomeMinInput()
        .type(CreateMarket.RangeofOutcomeMinimum);
      createForm.elements
        .rangeOfOutcomeMaxInput()
        .type(CreateMarket.RangeofOutcomeMaximum);
      createForm.elements
        .rangeOfOutcomeTicker()
        .type(CreateMarket.RangeofOutcomeTicker);
      createForm.elements.oracleLabel().should("be.visible");
      cy.get("@accountAddress").then((oracleInput) => {
        createForm.elements.oracleInput().type(oracleInput);
      });
      createForm.elements.marketDescriptionLabel().should("be.visible");
      createForm.elements
        .marketDescriptionTextbox()
        .type(CreateMarket.MarketDescription);
      // createForm.elements.permissionlessSwitch().eq(1)
      // .click()
      // createForm.elements.permissionlessLabel()
      // .should('be.visible')
      // .and('have.css','color','rgb(0,0,0,var(--tw-text-opacity))')
      createForm.elements.liquiditypoolon().eq(0).click();
      createForm.elements
        .createMarketButton()
        .should("be.visible")
        .and("not.be.disabled")
        .click();
      createForm.elements.notificationMessage().should("be.visible");
      createForm.elements.notificationMessage().should("be.visible");
      marketPage.elements
        .TokenText()
        .eq(0)
        .contains(CreateMarket.Multipleoutcometicker0 + "-L");
      marketPage.elements.OutcomeText().eq(0).contains("Long");
      marketPage.elements
        .TokenText()
        .eq(1)
        .contains(CreateMarket.Multipleoutcometicker0 + "-S");
      marketPage.elements.OutcomeText().eq(1).contains("Short");
      marketPage.elements
        .InspectButton()
        .eq(0)
        .scrollIntoView()
        .should("be.visible")
        .click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
      marketPage.elements
        .InspectButton()
        .eq(1)
        .scrollIntoView()
        .should("be.visible")
        .click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
    });
    it("Verify user is able to create market with range of outcomes-permissionless-without LiquidityPool", () => {
      createForm.elements.slugField().type(CreateMarket.slug);
      createForm.elements.questionField().type(CreateMarket.Marketquestion);
      createForm.elements.tagChoices().should("be.visible"),
        createForm.elements.tagNorthAmerica().eq(1).click();
      createForm.elements.marketEndsLabel().should("be.visible");
      createForm.elements.marketEndsOption().should("be.visible");
      createForm.elements
        .outcomesSwitch()
        .eq(0)
        .scrollIntoView()
        .should("be.visible")
        .click();
      createForm.elements
        .rangeOfOutcomeMinInput()
        .type(CreateMarket.RangeofOutcomeMinimum);
      createForm.elements
        .rangeOfOutcomeMaxInput()
        .type(CreateMarket.RangeofOutcomeMaximum);
      createForm.elements
        .rangeOfOutcomeTicker()
        .type(CreateMarket.RangeofOutcomeTicker);
      createForm.elements.oracleLabel().should("be.visible");
      cy.get("@accountAddress").then((oracleInput) => {
        createForm.elements.oracleInput().type(oracleInput);
      });
      createForm.elements.marketDescriptionLabel().should("be.visible");
      createForm.elements
        .marketDescriptionTextbox()
        .type(CreateMarket.MarketDescription);
      createForm.elements.permissionlessSwitch().eq(1);
      createForm.elements.permissionlessLabel().should("be.visible");
      // createForm.elements.liquiditypooloff().eq(1)
      // .click()
      createForm.elements
        .createMarketButton()
        .should("be.visible")
        .and("not.be.disabled")
        .click();
      createForm.elements.notificationMessage().should("be.visible");
      createForm.elements.notificationMessage().should("be.visible");
      marketPage.elements.LiquidityPoolMessage().should("be.visible");
      marketPage.elements
        .TokenText()
        .eq(0)
        .contains(CreateMarket.Multipleoutcometicker0 + "-L");
      marketPage.elements.OutcomeText().eq(0).contains("Long");
      marketPage.elements
        .TokenText()
        .eq(1)
        .contains(CreateMarket.Multipleoutcometicker0 + "-S");
      marketPage.elements.OutcomeText().eq(1).contains("Short");
      marketPage.elements.LiquidityButton().should("be.visible");
      //.click()
      marketPage.elements.InspectButton().eq(0).should("be.visible").click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
      marketPage.elements.InspectButton().eq(1).should("be.visible").click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
    });
    it("Verify user is able to create market with range of outcomes advised market", () => {
      createForm.elements.slugField().type(CreateMarket.slug);
      createForm.elements.questionField().type(CreateMarket.Marketquestion);
      createForm.elements.tagChoices().should("be.visible"),
        createForm.elements.tagNorthAmerica().eq(1).click();
      createForm.elements.marketEndsLabel().should("be.visible");
      createForm.elements.marketEndsOption().should("be.visible");
      createForm.elements
        .outcomesSwitch()
        .eq(0)
        .scrollIntoView()
        .should("be.visible")
        .click();
      // createForm.elements.rangeOfOutcomes()
      // .should('be.visible')
      createForm.elements
        .rangeOfOutcomeMinInput()
        .type(CreateMarket.RangeofOutcomeMinimum);
      createForm.elements
        .rangeOfOutcomeMaxInput()
        .type(CreateMarket.RangeofOutcomeMaximum);
      createForm.elements
        .rangeOfOutcomeTicker()
        .type(CreateMarket.RangeofOutcomeTicker);
      createForm.elements.oracleLabel().should("be.visible");
      cy.get("@accountAddress").then((oracleInput) => {
        createForm.elements.oracleInput().type(oracleInput);
      });
      createForm.elements.marketDescriptionLabel().should("be.visible");
      createForm.elements
        .marketDescriptionTextbox()
        .type(CreateMarket.MarketDescription);
      createForm.elements.permissionlessSwitch().eq(1).click();
      createForm.elements.advisedLabel().should("be.visible");
      createForm.elements
        .createMarketButton()
        .should("be.visible")
        .and("not.be.disabled")
        .click();
      createForm.elements.notificationMessage().should("be.visible");
      createForm.elements.notificationMessage().should("be.visible");
      marketPage.elements.LiquidityPoolMessage().should("be.visible");
      marketPage.elements
        .TokenText()
        .eq(0)
        .contains(CreateMarket.Multipleoutcometicker0 + "-L");
      marketPage.elements.OutcomeText().eq(0).contains("Long");
      marketPage.elements
        .TokenText()
        .eq(1)
        .contains(CreateMarket.Multipleoutcometicker0 + "-S");
      marketPage.elements.OutcomeText().eq(1).contains("Short");
      marketPage.elements.InspectButton().eq(0).should("be.visible").click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
      marketPage.elements.InspectButton().eq(1).should("be.visible").click();
      cy.get("@accountAddress").then((oracleInput) =>
        marketPage.elements.AddressDetails().contains(oracleInput)
      );
      marketPage.elements.CloseInspect().should("be.visible").click();
    });
  });
});
