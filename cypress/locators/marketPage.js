class marketForm {
  elements = {
    TokenText: () => cy.get('[data-test="tokenText"]'),
    OutcomeText: () => cy.get('[data-test="outcomeText"]'),
    InspectButton: () => cy.get('[data-test="inspectButton"]'),
    AddressDetails: () => cy.get('[data-test="addressDetails"]'),
    CloseInspect: () => cy.get('[data-test="closeInspect"]'),
    LiquidityPoolMessage: () => cy.get('[data-test="liquidityPoolMessage"]'),
    LiquidityButton: () => cy.get('[data-test="deployLiquidityButton"]'),
  };
}
module.exports = new marketForm();
