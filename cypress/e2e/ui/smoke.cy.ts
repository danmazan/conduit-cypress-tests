describe('smoke test', () => {
  it('should load the home page', () => {
    cy.visit('/');
    cy.get('app-layout-header').should('be.visible');
  });
});
