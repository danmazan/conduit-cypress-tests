import users from '../../fixtures/users.json';
import { RegisterPage } from '../../support/page-objects/registerPage';
import { randomUser } from '../../support/test-data';
 
describe('Register - UI', () => {
  const registerPage = new RegisterPage();
 
  beforeEach(() => {
    registerPage.visit();
  });
 
  it('registers a new user through the form and lands on the home page as that user', () => {
    const user = randomUser();
 
    registerPage.register(user);
 
    cy.location('pathname').should('eq', '/');
    registerPage.assertLoggedInAs(user.username);
    registerPage.assertJwtStored();
  });
 
  it('shows an error when the email is already taken', () => {
    registerPage.register({ ...randomUser(), email: users.poolUser3.email });
 
    registerPage.errorMessages.should('have.length', 1).and('contain.text', 'email has already been taken');
    cy.location('pathname').should('eq', '/register');
    registerPage.assertLoggedOut();
  });
 
  it('shows an error when the username is already taken', () => {
    registerPage.register({ ...randomUser(), username: users.poolUser3.username });
 
    registerPage.errorMessages.should('have.length', 1).and('contain.text', 'username has already been taken');
    cy.location('pathname').should('eq', '/register');
  });
 
  it('keeps the Sign up button disabled until all three fields are filled', () => {
    const user = randomUser();
    registerPage.submitButton.should('be.disabled');
 
    registerPage.typeUsername(user.username).typeEmail(user.email);
    registerPage.submitButton.should('be.disabled');
 
    registerPage.typePassword(user.password);
    registerPage.submitButton.should('be.enabled');
  });
 
  // Whitespace passes the frontend's "required" check (it is a non-empty string),
  // so this exercises the backend's server-side trim/blank validation through the UI.
  it('surfaces the server-side error when the username is whitespace only', () => {
    registerPage.register({ ...randomUser(), username: '   ' });
 
    registerPage.errorMessages.should('have.length', 1).and('contain.text', "username can't be blank");
    cy.location('pathname').should('eq', '/register');
  });
 
  // KNOWN ISSUE: no email format validation anywhere. The backend accepts
  // "not-an-email" (confirmed live, 201), and per the reference frontend's source
  // the email field is a plain text input with only a "required" check. Asserts
  // the reasonably-expected behavior; skipped so it stays visible in the
  // Mochawesome report as a flagged gap.
  it.skip('KNOWN ISSUE: shows an error when the email is not a valid format', () => {
    registerPage.register({ ...randomUser(), email: 'not-an-email' });
 
    registerPage.errorMessages.should('have.length.at.least', 1);
    cy.location('pathname').should('eq', '/register');
  });
});