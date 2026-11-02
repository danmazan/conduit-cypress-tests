import users from '../../fixtures/users.json';
import { LoginPage } from '../../support/page-objects/loginPage';

describe('Login - UI', () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    loginPage.visit();
  });
  it('logs in with valid credentials and lands on the home page as that user', () => {
    const {email, password, username } = users.poolUser1;
    loginPage.login(email, password);
    cy.location('pathname').should('eq', '/');
    loginPage.assertLoggedInAs(username);
    loginPage.assertJwtStored();
  });

  it('shows an error and stays on the login page when the password is invalid', () => {
    const {email, password } = users.poolUser1;
    loginPage.login(email, password + 'invalid');
    cy.location('pathname').should('eq', '/login');
    loginPage.assertLoggedOut();
    loginPage.errorMessages.should('contain.text', 'email or password is invalid');
  })

  it('show the same error when the email does not exist', () => {
    const {email, password } = users.poolUser1;
    loginPage.login('nonexistent' + email, password);
    cy.location('pathname').should('eq', '/login');
    loginPage.assertLoggedOut();
    loginPage.errorMessages.should('contain.text', 'email or password is invalid');
  });

  it('keeps the Sign in button disabled until both fields are filled in', () => {
    loginPage.submitButton.should('be.disabled');
    loginPage.typeEmail(users.poolUser1.email);
    loginPage.submitButton.should('be.disabled');
    loginPage.typePassword(users.poolUser1.password);
    loginPage.submitButton.should('be.enabled');
  });

  it('redirects to register page when Need an account? link is clicked', () => {
    loginPage.registerLink.click();
    cy.location('pathname').should('eq', '/register');
  });
})