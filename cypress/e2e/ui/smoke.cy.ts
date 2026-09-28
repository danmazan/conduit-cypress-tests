import users from '../../fixtures/users.json';

describe('loginBySession sanity check', () => {
  it('logs in and renders as the correct user', () => {
    cy.loginBySession(users.poolUser1);
    cy.contains('app-layout-header a',users.poolUser1.username).should('be.visible'); 
  });

  it('reuses the cached session on a second call', () => {
    cy.loginBySession(users.poolUser1);
    cy.contains(users.poolUser1.username).should('be.visible');
  });
});