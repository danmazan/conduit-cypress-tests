/// <reference types="cypress" />

import users from '../../fixtures/users.json';
import { authHeaders } from './user-commands';
import type { ApiLoginCredentials, ApiUser } from './user-commands';

export interface ApiProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

declare global {
  namespace Cypress {
    interface Chainable {
      apiFollowUser(follower: ApiLoginCredentials, username: string): Chainable<ApiProfile>;
      apiUnfollowUser(follower: ApiLoginCredentials, username: string): Chainable<ApiProfile>;
      apiResetFollows(follower: ApiUser): Chainable<void>;
    }
  }
}

// Both are idempotent on this backend, so apiUnfollowUser is safe as cleanup
// even when the test failed before following.
Cypress.Commands.add('apiFollowUser', (follower: ApiLoginCredentials, username: string) => {
  authHeaders(follower).then((headers) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/profiles/${username}/follow`,
      headers,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, 'apiFollowUser status').to.eq(200);
      return response.body.profile as ApiProfile;
    });
  });
});

Cypress.Commands.add('apiUnfollowUser', (follower: ApiLoginCredentials, username: string) => {
  authHeaders(follower).then((headers) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/profiles/${username}/follow`,
      headers,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, 'apiUnfollowUser status').to.eq(200);
      return response.body.profile as ApiProfile;
    });
  });
});

// Unfollows every other pool user, so a spec's follow baseline never depends on
// state left by another spec or an aborted run. Follow state is not auto-cleaned.
Cypress.Commands.add('apiResetFollows', (follower: ApiUser) => {
  Object.values(users)
    .filter((user) => user.username !== follower.username)
    .forEach((user) => cy.apiUnfollowUser(follower, user.username));
});
