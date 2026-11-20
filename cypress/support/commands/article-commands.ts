/// <reference types="cypress" />

import { ArticleEditorPage } from '../page-objects/articleEditorPage';
import { randomArticle } from '../test-data';
import { authHeaders } from './user-commands';
import type { ApiLoginCredentials } from './user-commands';
import type { ApiProfile } from './profile-commands';

export interface ApiArticleInput {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface ApiArticle {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ApiProfile;
}

declare global {
  namespace Cypress {
    interface Chainable {
      apiCreateArticle(
        author: ApiLoginCredentials,
        article?: ApiArticleInput
      ): Chainable<ApiArticle>;
      apiGetArticle(
        slug: string,
        viewer?: ApiLoginCredentials
      ): Chainable<Cypress.Response<{ article?: ApiArticle }>>;
      apiDeleteArticle(author: ApiLoginCredentials, slug: string): Chainable<void>;
      apiDeleteTrackedArticles(): Chainable<void>;
      apiFavoriteArticle(user: ApiLoginCredentials, slug: string): Chainable<ApiArticle>;
      apiUnfavoriteArticle(user: ApiLoginCredentials, slug: string): Chainable<ApiArticle>;
      apiAssertFavoriteState(
        viewer: ApiLoginCredentials,
        slug: string,
        favorited: boolean,
        count: number
      ): Chainable<void>;
      uiPublishArticle(author: ApiLoginCredentials, article?: ApiArticleInput): Chainable<string>;
      uiWaitForArticlePublish(
        author: ApiLoginCredentials,
        expectedStatus: number
      ): Chainable<string | undefined>;
      uiWaitForArticleUpdate(
        oldSlug: string,
        expectedStatus: number
      ): Chainable<string | undefined>;
      uiWaitForArticleDelete(slug: string): Chainable<void>;
    }
  }
}

// --- Cleanup registry ---
// Every article created through apiCreateArticle is tracked here, and the global
// afterEach in e2e.ts deletes them all via apiDeleteTrackedArticles. Articles
// created through the UI must be tracked explicitly by the spec.

const trackedArticles: { slug: string; owner: ApiLoginCredentials }[] = [];

export function trackArticle(owner: ApiLoginCredentials, slug: string): void {
  trackedArticles.push({ slug, owner });
}

// For a spec that deleted the article itself (e.g. through the UI).
export function untrackArticle(slug: string): void {
  const index = trackedArticles.findIndex((article) => article.slug === slug);
  if (index !== -1) {
    trackedArticles.splice(index, 1);
  }
}

// Changing the title changes the slug on this backend.
export function retrackArticle(oldSlug: string, newSlug: string): void {
  trackedArticles
    .filter((article) => article.slug === oldSlug)
    .forEach((article) => (article.slug = newSlug));
}

// Setup command: asserts success so a broken precondition fails here, not in the scenario.
// Authenticated requests use failOnStatusCode: false + an explicit expect throughout,
// so a failure message never echoes the Authorization header.
Cypress.Commands.add(
  'apiCreateArticle',
  (author: ApiLoginCredentials, article: ApiArticleInput = randomArticle()) => {
    authHeaders(author).then((headers) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/articles`,
        headers,
        body: { article },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status, 'apiCreateArticle status').to.eq(201);
        trackArticle(author, response.body.article.slug);
        return response.body.article as ApiArticle;
      });
    });
  }
);

// failOnStatusCode false so specs can assert a deleted article is gone (404).
Cypress.Commands.add('apiGetArticle', (slug: string, viewer?: ApiLoginCredentials) => {
  const request = (headers: Record<string, string>) =>
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/articles/${slug}`,
      headers,
      failOnStatusCode: false,
    });
  if (viewer) {
    authHeaders(viewer).then(request);
  } else {
    request({});
  }
});

// Fails loudly on anything but 204 so leaked data is never silent.
// Deleting an article also removes its comments and favorites (cascade on this backend).
Cypress.Commands.add('apiDeleteArticle', (author: ApiLoginCredentials, slug: string) => {
  authHeaders(author).then((headers) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/articles/${slug}`,
      headers,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, `apiDeleteArticle status for "${slug}"`).to.eq(204);
      untrackArticle(slug);
    });
  });
});

// Attempts every delete first and asserts once at the end, so one failure
// can't leave the remaining articles behind.
Cypress.Commands.add('apiDeleteTrackedArticles', () => {
  const pending = trackedArticles.splice(0);
  const failures: string[] = [];
  pending.forEach(({ slug, owner }) => {
    authHeaders(owner).then((headers) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/articles/${slug}`,
        headers,
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status !== 204) {
          failures.push(`${slug} (${response.status})`);
        }
      });
    });
  });
  cy.then(() => {
    expect(failures, 'tracked articles that failed to delete').to.be.empty;
  });
});

Cypress.Commands.add('apiFavoriteArticle', (user: ApiLoginCredentials, slug: string) => {
  authHeaders(user).then((headers) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/articles/${slug}/favorite`,
      headers,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, 'apiFavoriteArticle status').to.eq(200);
      return response.body.article as ApiArticle;
    });
  });
});

Cypress.Commands.add('apiUnfavoriteArticle', (user: ApiLoginCredentials, slug: string) => {
  authHeaders(user).then((headers) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/articles/${slug}/favorite`,
      headers,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, 'apiUnfavoriteArticle status').to.eq(200);
      return response.body.article as ApiArticle;
    });
  });
});

// Checks favorite state as the viewer sees it through the API.
Cypress.Commands.add(
  'apiAssertFavoriteState',
  (viewer: ApiLoginCredentials, slug: string, favorited: boolean, count: number) => {
    cy.apiGetArticle(slug, viewer).then(({ status, body }) => {
      expect(status, 'get article status').to.eq(200);
      expect(body.article?.favorited, 'favorited for viewer').to.eq(favorited);
      expect(body.article?.favoritesCount, 'favoritesCount').to.eq(count);
    });
  }
);

// Registers @favorite and @unfavorite for both the article page button and preview hearts.
export function interceptFavoriteRequests(): void {
  cy.intercept('POST', '**/api/articles/*/favorite').as('favorite');
  cy.intercept('DELETE', '**/api/articles/*/favorite').as('unfavorite');
}

// --- UI-created articles ---

// Waits for the editor's POST (registered by ArticleEditorPage.interceptPublish) and
// tracks whatever the backend created before asserting, so even an unexpected
// success on a negative test can't leak. Yields the slug, if any.
Cypress.Commands.add(
  'uiWaitForArticlePublish',
  (author: ApiLoginCredentials, expectedStatus: number) => {
    cy.wait('@createArticle').then(({ response }) => {
      const slug: string | undefined = response?.body.article?.slug;
      if (slug) {
        trackArticle(author, slug);
      }
      expect(response?.statusCode, 'create article status').to.eq(expectedStatus);
      return slug;
    });
  }
);

// Waits for the editor's PUT (registered by ArticleEditorPage.interceptUpdate). A title
// change changes the slug on this backend, so the article is retracked before
// asserting and cleanup always targets the current slug. Yields the new slug, if any.
Cypress.Commands.add('uiWaitForArticleUpdate', (oldSlug: string, expectedStatus: number) => {
  cy.wait('@updateArticle').then(({ response }) => {
    const newSlug: string | undefined = response?.body.article?.slug;
    if (newSlug) {
      retrackArticle(oldSlug, newSlug);
    }
    expect(response?.statusCode, 'update article status').to.eq(expectedStatus);
    return newSlug;
  });
});

// Waits for the article page's DELETE (registered by ArticlePage.interceptDelete) and
// untracks the article only once the backend confirmed it, so a failed delete is
// still cleaned up by the global afterEach.
Cypress.Commands.add('uiWaitForArticleDelete', (slug: string) => {
  cy.wait('@deleteArticle').then(({ response }) => {
    if (response?.statusCode === 204) {
      untrackArticle(slug);
    }
    expect(response?.statusCode, 'delete article status').to.eq(204);
  });
});

// Publishes through the editor (the user must already be logged in as the author)
// and yields the new slug, tracked for cleanup.
Cypress.Commands.add(
  'uiPublishArticle',
  (author: ApiLoginCredentials, article: ApiArticleInput = randomArticle()) => {
    const editorPage = new ArticleEditorPage();
    editorPage.interceptPublish().visit();
    editorPage.fillAndPublish(article);
    cy.uiWaitForArticlePublish(author, 201).then((slug) => slug as string);
  }
);
