/// <reference types="cypress" />

export interface ApiUser{
    username: string;
    email: string;
    password: string;
}

declare global {
    namespace Cypress {
        interface Chainable {
            apiRegister(user: ApiUser): Chainable<Cypress.Response<{ user: ApiUser & { token: string; bio: string | null; image: string | null } }>>;
        }
  }
}

// failOnStatuseCode set to false to test negative scenarios like duplicate user registration
Cypress.Commands.add('apiRegister', (user: ApiUser) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/users`,
        body: { user },
        failOnStatusCode: false
    });
});