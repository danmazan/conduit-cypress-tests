import users from '../../fixtures/users.json';

describe('smoke test', () => {
  it('log in via session', () => {
    cy.loginBySession(users.poolUser1);
    cy.get('app-layout-header ul li a').contains(users.poolUser1.username).should('be.visible');
    cy.reload();
  });
});
