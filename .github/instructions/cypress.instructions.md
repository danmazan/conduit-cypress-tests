---
applyTo: "cypress/**/*.ts,cypress.config.ts"
description: "Cypress and TypeScript E2E guidance for the Conduit test project"
---

# Cypress Project Instructions

## Governing principle

Prefer the smallest reliable test that proves user-visible or API-consumer behavior. Centralize reusable setup, isolate mutable state, and preserve deterministic execution over convenience or speed.

## Project targets and test shape

- Keep the intentional split: `cypress/e2e/ui/` contains user journeys against `https://demo.realworld.show`; `cypress/e2e/api/` contains resource and contract tests against the local API.
- The configured API is `http://localhost:4000/api`. Never send test traffic to the public API.
- UI tests must call `cy.interceptApiToLocalhost()` so the public frontend's API requests reach the local backend.
- Cover must-have flows at both UI and API layers. Assert observable behavior, not framework or implementation details.
- Preserve serial execution. Do not add Cypress parallelization without revisiting the documented test strategy.

## Data, authentication, and isolation

- Make every test independently runnable and independent of test or spec order.
- Reuse the fixed accounts in `cypress/fixtures/users.json` for stable identities. Do not create another pool of shared users.
- Register-flow tests may create randomized throwaway accounts because the API has no delete-user endpoint.
- Create articles and comments through reusable API commands with unique data. Each test owns its mutable data and cleans it up through API commands.
- Use `cy.loginBySession()` for UI authentication and `cy.apiLogin()` for API setup. Do not repeat login mechanics in specs.
- Use `afterEach` or `after` cleanup hooks where appropriate. Attempt all cleanup, then fail loudly if cleanup fails; never hide teardown errors.
- Never commit real secrets or log passwords, JWTs, authorization headers, or sensitive response bodies. Fixture credentials are intentional for this local demo project.

## Commands, page objects, and selectors

- Put reusable request construction, authentication headers, and common validation in typed custom commands such as `cy.apiRegister()` and `cy.apiCreateArticle()`.
- Keep specs focused on scenario-specific setup and assertions; do not duplicate raw `cy.request()` mechanics.
- Use pragmatic page objects for repeated route interactions and complex UI workflows. Simple one-off assertions may use direct Cypress queries.
- Prefer accessible roles, labels, visible text, and stable `data-*` hooks. Avoid CSS classes, generated IDs, deep descendant chains, and positional selectors such as `:nth-child()`.
- Use camelCase command names grouped by domain (`api*` and `ui*`) and PascalCase page objects with a `Page` suffix.

## Synchronization and assertions

- Let Cypress retry assertions and query commands. Synchronize on observable state or aliased network requests.
- Do not use arbitrary sleeps such as `cy.wait(1000)`. Use `cy.intercept()` aliases and `cy.wait('@alias')` when network completion matters.
- API tests should assert status, response shape, and important fields without snapshotting incidental or entire response bodies.
- Keep each test centered on one behavior and make failure messages identify the expected business outcome.
- When the local backend differs from canonical RealWorld behavior, assert the observed local contract and document the intentional deviation in a concise comment or project strategy note.

## TypeScript and test hygiene

- Keep command payloads, response shapes, and fixtures typed. Avoid `any`; use a narrow cast only when deliberately testing malformed or missing input.
- Do not commit `it.only` or `describe.only`.
- A committed skip must represent a reproducible product or backend limitation, include `KNOWN ISSUE` in the title, and have a nearby comment referencing a tracking issue or the relevant strategy note. Never skip to hide flakiness or unfinished work.
- Do not use retries to mask flaky tests. Fix synchronization, data isolation, or application defects instead; retries require an explicit CI policy.
- Follow the repository's feature-flow filenames, such as `article-crud.cy.ts` and `follow-feed.cy.ts`.

## Validation workflow

- Run the touched spec first, for example: `npx cypress run --spec "cypress/e2e/api/register.cy.ts"`.
- Run `npm run lint` after Cypress changes and `npm run format` when formatting is needed.
- Run the full suite when shared commands or Cypress configuration change, and before a release or broad refactor.

For rationale and scope, see [test-strategy.md](../../test-strategy.md), the repository-wide [Copilot instructions](../copilot-instructions.md), and the shared [Cypress command layer](../../cypress/support/commands/user-commands.ts).