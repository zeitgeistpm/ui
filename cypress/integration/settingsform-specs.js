import settingsform from "../locators/settingsFormLocators.js";
import settingsTestdata from "../fixtures/settingsTestData.json";

describe("Account settings form", () => {
  beforeEach(() => {
    window.localStorage.setItem("endpoint-1", '"ws://127.0.0.1:9944"');
    window.localStorage.setItem(
      "gql-endpoint-1",
      '"http://localhost:4350/graphql"'
    );
    window.localStorage.setItem("walletId", '"polkadot-js"');
    cy.visit("/settings");
  });
  context("When user gives the required valid inputs", () => {
    it("Verify each input should not allow entering more than 16 characters or 32 bytes & verify set identity button becomes clickable", () => {
      settingsform.elements.DisplayNameLabel().should("be.visible");
      settingsform.elements
        .DisplayNameInput()
        .type(settingsTestdata.Displayname)
        .should("have.value", settingsTestdata.Displayname.substring(0, 16));
      settingsform.elements.SetIdentityButton().should("not.be.disabled");
      settingsform.elements.DisplayNameInput().clear();
      settingsform.elements.DiscordLabel().should("be.visible");
      settingsform.elements
        .DiscordInput()
        .type(settingsTestdata.Discord)
        .should("have.value", settingsTestdata.Discord.substring(0, 16));
      settingsform.elements.SetIdentityButton().should("not.be.disabled");
      settingsform.elements.DiscordInput().clear();
      settingsform.elements.TwitterLabel().should("be.visible");
      settingsform.elements
        .TwitterInput()
        .type(settingsTestdata.Twitter)
        .should("have.value", settingsTestdata.Twitter.substring(0, 16));
      settingsform.elements.SetIdentityButton().should("not.be.disabled");
    });
    it("When user wants to set the Identity Verify that Setting identity requires a deposit of a maximum of 11 ZTG and if there is no balance on account, submit button is disabled.", () => {
      settingsform.elements.DisplayNameLabel().should("be.visible");
      settingsform.elements
        .DisplayNameInput()
        .type(settingsTestdata.Displayname);
      settingsform.elements.AccountBalance().then(($amount) => {
        const creditBalance = $amount.text().slice(0, -3);
        cy.log(creditBalance);
        if (creditBalance > 0) {
          settingsform.elements.SetIdentityButton().should("be.disabled");
        } else {
          settingsform.elements.SetIdentityButton().should("not.be.disabled");
        }
      });
    });
    it("After setting identity verify inputs contains the same text", () => {
      settingsform.elements.DisplayNameLabel().should("be.visible");
      settingsform.elements
        .DisplayNameInput()
        .type(settingsTestdata.Displayname)
        .should("have.value", settingsTestdata.Displayname.substring(0, 16));
      settingsform.elements.DiscordLabel().should("be.visible");
      settingsform.elements.SetIdentityButton().should("not.be.disabled");
      settingsform.elements.SetIdentityButton().click();
      settingsform.elements.infoMessage().should("be.visible");
      settingsform.elements.successMessage().should("be.visible");
      settingsform.elements
        .DisplayNameInput()
        .should("have.value", settingsTestdata.Displayname);
    });
  });
  context("When user wants to clear the Identity", () => {
    it("Verify balance should get increased after clearing identity", () => {
      settingsform.elements.DisplayNameLabel().should("be.visible");
      settingsform.elements.AccountBalance().then(($amount) => {
        const creditBalance = $amount.text().slice(0, -3);
        cy.log(creditBalance);
        settingsform.elements.ClearIdentityButton().click();
        settingsform.elements.infoMessage().should("be.visible");
        settingsform.elements.successMessage().should("be.visible");
        const newval = parseFloat(creditBalance.replace(/,/g, "")) + 11;
        cy.log(newval);
        settingsform.elements
          .AccountBalance()
          .should("have.text", newval.toLocaleString("en-US") + " DEV");
        cy.log(newval.toLocaleString("en-US"));
      });
    });
  });
});
