// cypress/e2e/_setup/seed-pool-users.cy.ts
//
// One-time / idempotent setup: ensures the fixture pool users exist on the
// live API. This is NOT part of the regular suite's coverage and shouldn't
// be counted as a "test" in reporting — consider excluding cypress/e2e/_setup
// from your normal `npm run test` glob and running it manually/on-demand
// instead (e.g. `npx cypress run --spec "cypress/e2e/_setup/**"`).
//
// IMPORTANT: this uses a login-first pattern rather than relying on
// register returning 422 for an existing user. This live instance does
// NOT appear to enforce email/username uniqueness on register (repeated
// registration attempts return 201 every time instead of 422), so
// register's response can't be trusted to detect "already exists". Instead
// we check directly: try to log in with the pool credentials; only
// register if that login fails. This is idempotent regardless of whether
// the API enforces uniqueness or not.

import users from '../../fixtures/users.json';

describe('Seed pool users (setup utility, not a real test)', () => {
  Object.entries(users).forEach(([key, user]) => {
    it(`ensures ${key} (${user.username}) exists`, () => {
      cy.apiLogin({ email: user.email, password: user.password }).then((loginResponse) => {
        const alreadyExists = loginResponse.status === 200;

        if (alreadyExists) {
          cy.log(`${key} already exists and logs in successfully — skipping register`);
          return;
        }

        cy.apiRegister({
          username: user.username,
          email: user.email,
          password: user.password,
        }).then((registerResponse) => {
          const created = registerResponse.status === 200 || registerResponse.status === 201;
          expect(
            created,
            `unexpected register status ${registerResponse.status} for ${user.username}`
          ).to.be.true;
        });
      });
    });
  });
});
