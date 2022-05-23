class settingsform {
  elements = {
    MyAccount: () => cy.contains("div", "My Account"),
    Mysettings: () => cy.contains("span", "My Settings"),
    AccountSettingsHeader: () => cy.contains("h2", "Account Settings"),
    DisplayNameLabel: () => cy.contains("div", "Display Name"),
    DisplayNameInput: () => cy.get("[data-test=display-name]"),
    DiscordLabel: () => cy.contains("div", "Discord"),
    DiscordInput: () => cy.get("[data-test=discord]"),
    TwitterLabel: () => cy.contains("div", "Twitter"),
    TwitterInput: () => cy.get("[data-test=twitter]"),
    SetIdentityButton: () => cy.contains("div", "Set Identity"),
    ClearIdentityButton: () => cy.contains("button", "Clear Identity"),
    AccountBalance: () => cy.get('[data-test="accountBalance"]'),
    successMessage: () => cy.contains("span", "Success!"),
    infoMessage: () => cy.contains("span", "Info!"),
  };
}
module.exports = new settingsform();
