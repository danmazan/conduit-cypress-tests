// cypress/support/test-data.ts

import type { ApiArticleInput } from './commands/article-commands';
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

// Unique article data. Slugs are "<slugified title>-<authorId>" on this backend,
// so the title must be unique per author.
export function randomArticle(overrides: Partial<ApiArticleInput> = {}): ApiArticleInput {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    title: `Cypress article ${unique}`,
    description: `Description ${unique}`,
    body: `Body of article ${unique}`,
    tagList: [`tag${unique}`],
    ...overrides,
  };
}

// Unique comment text so assertions never match a comment from another test or run.
export function randomComment(label: string): string {
  return `${label} ${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
