class settingsform {
  elements = {
    // MyAccount: () => cy.get(),
    // Mysettings: () => cy.contains("span", "My Settings"),
    AccountSettingsHeader: () => cy.get('[data-test="accountSettingsHeader"]'),
    DisplayNameLabel: () => cy.get('[data-test="displayNameLabel"]'),
    DisplayNameInput: () => cy.get("[data-test=display-name]"),
    DiscordLabel: () => cy.get('[data-test="discordLabel"]'),
    DiscordInput: () => cy.get("[data-test=discord]"),
    TwitterLabel: () => cy.get('[data-test="twitterLabel"]'),
    TwitterInput: () => cy.get("[data-test=twitter]"),
    SetIdentityButton: () => cy.get('[data-test="setIdentityButton"]'),
    ClearIdentityButton: () => cy.get('[data-test="setIdentityButton"]'),
    AccountBalance: () => cy.get('[data-test="accountBalance"]'),
    notificationMessage: () => cy.get('[data-test="notificationMessage"]')
  };
}
module.exports = new settingsform();
