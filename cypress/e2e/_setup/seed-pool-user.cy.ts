// cypress/e2e/_setup/seed-pool-users.cy.ts
//
// One-time / idempotent setup: ensures the fixture pool users exist on the
// live API. Safe to re-run any time — a 422 "already taken" response is
// treated as success (the user already exists from a prior run), not a
// failure. This is NOT part of the regular suite's coverage and shouldn't
// be counted as a "test" in reporting — consider excluding cypress/e2e/_setup
// from your normal `npm run test` glob and running it manually/on-demand
// instead (e.g. `npx cypress run --spec "cypress/e2e/_setup/**"`).

import users from '../../fixtures/users.json';

describe('Seed pool users (setup utility, not a real test)', () => {
  Object.entries(users).forEach(([key, user]) => {
    it(`ensures ${key} (${user.username}) exists`, () => {
      cy.apiRegister({
        username: user.username,
        email: user.email,
        password: user.password,
      }).then((response) => {
        cy.log('Status', response.status);
        cy.log('Allow header:', response.headers['allow']);
        console.log(response.headers);
        const alreadyExists = response.status === 422;
        const created = response.status === 201;

        expect(created || alreadyExists, `unexpected status ${response.status} for ${user.username}`).to.be.true;
      });
    });
  });
});