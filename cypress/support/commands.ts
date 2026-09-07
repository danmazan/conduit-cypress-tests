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
      interceptApiToLocalhost(): Chainable<void>;
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
  cy.interceptApiToLocalhost();
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
        validate: () => {
        // Presence in localStorage isn't enough — it could be a stale token
        // left over from a previous backend/database state. Confirm the
        // backend actually still accepts it.
        cy.window().then((win) => {
          const token = win.localStorage.getItem('jwtToken');
          expect(token, 'jwtToken present in localStorage').to.exist;
 
          cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/user`,
            headers: { Authorization: `Token ${token}` },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status, 'cached token still valid against backend').to.eq(200);
          });
        });
      }

    });
    // cy.session restores storage but doesn't navigate — visit (again) so the
  // app actually boots and reads the token, rendering as logged in.
    cy.visit('/');
});

Cypress.Commands.add('interceptApiToLocalhost', () => {
  const localOrigin = Cypress.env('apiUrl').replace(/\/api\/?$/, '');
  cy.intercept('GET', 'https://api.realworld.show/api/**', (req) => {
    req.url = req.url.replace('https://api.realworld.show', localOrigin);
  }).as('redirectedApiCall');
});
