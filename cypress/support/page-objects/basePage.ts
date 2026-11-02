export type ElementChain = Cypress.Chainable<JQuery<HTMLElement>>;
 
export abstract class BasePage {
  protected abstract readonly path: string;
 
  visit(): this {
    // Must be registered BEFORE the visit: the frontend's API calls are
    // hardcoded to api.realworld.show and fire as soon as the app boots.
    // Centralised here so no UI spec can forget it.
    cy.interceptApiToLocalhost();
    cy.visit(this.path);
    return this;
  }
 
  // Server-side validation errors rendered by the app, one <li> per field,
  // formatted as "<field> <message>" (e.g. "email has already been taken").
  get errorMessages(): ElementChain {
    return cy.get('ul.error-messages li');
  }
 
  assertLoggedInAs(username: string): void {
    cy.contains('nav.navbar a.nav-link', username).should('be.visible');
  }
 
  assertLoggedOut(): void {
    cy.contains('nav.navbar a.nav-link', 'Sign in').should('be.visible');
  }
 
  assertJwtStored(): void {
    cy.window().then((win) => {
      expect(win.localStorage.getItem('jwtToken'), 'jwtToken in localStorage').to.be.a('string').and.not.be.empty;
    });
  }
}