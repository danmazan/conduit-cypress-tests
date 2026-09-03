/// <reference types="cypress" />

export interface ApiUser {
  username: string;
  email: string;
  password: string;
}

export interface ApiLoginCredentials {
  email: string;
  password: string;
}

declare global {
  namespace Cypress {
    interface Chainable {
      apiRegister(user: ApiUser): Chainable<
        Cypress.Response<{
          user: ApiUser & { token: string; bio: string | null; image: string | null };
        }>
      >;
      apiLogin(user: ApiLoginCredentials): Chainable<
        Cypress.Response<{
          user: ApiUser & { token: string; bio: string | null; image: string | null };
        }>
      >;
      loginBySession(user: ApiUser): Chainable<void>;
    }
  }
}

// failOnStatuseCode set to false to test negative scenarios like duplicate user registration
Cypress.Commands.add('apiRegister', (user: ApiUser) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/users`,
    body: { user },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('apiLogin', (user: ApiLoginCredentials) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/users/login`,
    body: { user },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('loginBySession', (user: ApiUser) => {
    cy.session(user.username, () => {
        cy.apiLogin({ email: user.email, password: user.password }).then((loginResponse) => {
            expect(loginResponse.status, 'apiLogin status during loginBySession setup').to.eq(200);
            const token = loginResponse.body.user.token;
            cy.visit('/');
            cy.window().then((win) => {
                win.localStorage.setItem('jwtToken', token);
            });
        });
    },{
        validate:() => {
            cy.window().then((win) => {
                expect(win.localStorage.getItem('jwtToken'), 'jwtToken exists in localStorage').to.be.a('string').and.not.be.empty;
            });
        }

    });
    // cy.session restores storage but doesn't navigate — visit (again) so the
  // app actually boots and reads the token, rendering as logged in.
    cy.visit('/');
});
