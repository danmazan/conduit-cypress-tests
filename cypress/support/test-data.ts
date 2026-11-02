// cypress/support/test-data.ts

import type { ApiUser } from './commands/user-commands';

// Fresh, unique credentials for tests that create accounts (Register flow).
// Pool users from fixtures/users.json are for everything else.
export function randomUser(): ApiUser {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    username: `cypressUser${unique}`,
    email: `cypress-${unique}@example.com`,
    password: 'TestPass123!',
  };
}