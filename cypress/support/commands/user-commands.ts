/// <reference types="cypress" />

export interface ApiUser {
  username: string;
  email: string;
  password: string;
}

interface ApiUserResponse {
  username: string;
  email: string;
  token: string;
  bio: string | null;
  image: string | null;
}

interface ApiValidationError {
  dataPath?: string;
  keyword?: string;
  message?: string;
  params?: Record<string, unknown>;
  schemaPath?: string;
}

interface ApiErrors {
  body?: ApiValidationError[];
  [key: string]: unknown;
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
          user: ApiUserResponse;
          errors?: ApiErrors;
        }>
      >;
      apiLogin(user: ApiLoginCredentials): Chainable<
        Cypress.Response<{
          user: ApiUserResponse;
          errors?: ApiErrors;
        }>
      >;
      loginBySession(user: ApiUser): Chainable<void>;
      interceptApiToLocalhost(): Chainable<void>;
    }
  }
}

// Tokens are cached per spec run so API setup/teardown doesn't log in on every call.
const tokenCache = new Map<string, string>();

// Authorization header for API setup/teardown commands acting as `user`.
export function authHeaders(user: ApiLoginCredentials): Cypress.Chainable<Record<string, string>> {
  const cached = tokenCache.get(user.email);
  if (cached) {
    return cy.wrap<Record<string, string>>({ Authorization: `Token ${cached}` }, { log: false });
  }
  return cy.apiLogin({ email: user.email, password: user.password }).then((response) => {
    expect(response.status, `apiLogin status for ${user.email}`).to.eq(200);
    tokenCache.set(user.email, response.body.user.token);
    return { Authorization: `Token ${response.body.user.token}` } as Record<string, string>;
  });
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
  cy.session(
    user.username,
    () => {
      cy.apiLogin({ email: user.email, password: user.password }).then((loginResponse) => {
        expect(loginResponse.status, 'apiLogin status during loginBySession setup').to.eq(200);
        const token = loginResponse.body.user.token;
        cy.visit('/');
        cy.window().then((win) => {
          win.localStorage.setItem('jwtToken', token);
        });
      });
    },
    {
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
      },
    }
  );
  // cy.session restores storage but doesn't navigate — visit (again) so the
  // app actually boots and reads the token, rendering as logged in.
  cy.visit('/');
});

Cypress.Commands.add('interceptApiToLocalhost', () => {
  const localOrigin = Cypress.env('apiUrl').replace(/\/api\/?$/, '');
  cy.intercept('https://api.realworld.show/api/**', (req) => {
    req.url = req.url.replace('https://api.realworld.show', localOrigin);
  }).as('redirectedApiCall');
});
