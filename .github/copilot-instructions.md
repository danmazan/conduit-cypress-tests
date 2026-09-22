# Copilot instructions for this repository

## Commands

This repo is a Cypress + TypeScript E2E project for the Conduit/RealWorld demo app.

- Install dependencies: `npm install`
- Run the full suite: `npm run test`
  - This script runs Cypress headlessly, merges Mochawesome JSON files, and generates the HTML report at `cypress/reports/html/index.html`.
- Open the Cypress UI runner: `npm run cy:open`
- Run headless Cypress: `npm run cy:run`
- Run a single spec file: `npx cypress run --spec "cypress/e2e/api/login.cy.ts"`
  - Use this pattern for focused debugging instead of running the full suite.
- Lint: `npm run lint`
- Format: `npm run format`

If the app is not already running, ensure the local backend is up before exercising API/UI flows that depend on it. The project expects the API at `http://localhost:4000/api` via the `apiUrl` Cypress environment value.

## High-level architecture

- The repo is organized around Cypress specs under `cypress/e2e/`.
  - `cypress/e2e/ui/`: browser-based UI scenarios against `https://demo.realworld.show`
  - `cypress/e2e/api/`: API-level validation against the local Conduit backend
- `cypress.config.ts` sets the reporter pipeline and the default app/base URL.
  - `baseUrl` is `https://demo.realworld.show`
  - `env.apiUrl` is `http://localhost:4000/api`
- Global support is loaded from `cypress/support/e2e.ts`.
  - This file imports `./commands/user-commands`, which defines the repository's reusable Cypress helpers.
- The custom command layer is a core part of the project:
  - `cy.apiRegister(user)` sends a direct user-registration request
  - `cy.apiLogin(user)` sends a direct login request
  - `cy.loginBySession(user)` uses `cy.session()` and validates the saved JWT against the backend before visiting the app
  - `cy.interceptApiToLocalhost()` rewrites app traffic from `https://api.realworld.show` to the local backend so the UI test app can still target the public frontend while testing against a durable local API
- `cypress/fixtures/users.json` holds the shared pool of seeded users used across tests.
- Reporting is configured with Mochawesome (`reporter: "mochawesome"`), and the generated JSON is merged into a final HTML report.

## Key conventions in this repo

- Prefer reusable Cypress commands over raw request logic inside individual specs.
  - Most API setup and auth flows are intentionally centralized in `cypress/support/commands/user-commands.ts`.
- For UI auth flows, use `cy.session()` and `cy.loginBySession()` rather than repeating a login sequence in every spec.
- Keep stable credentials in `cypress/fixtures/users.json` for the reusable pool users, and use generated account data only for register-flow tests that intentionally create a new account.
- The project is intentionally split between UI and API parity: many behavior flows are validated at both layers, not just one.
- The backend behavior does not always match the canonical RealWorld spec exactly in this repo's local setup.
  - The tests explicitly assert the actual response behavior seen from the local backend (for example, duplicate email/username responses and validation payloads).
- `cypress/**/*.ts` files are the active test code; follow the existing Mocha `describe`/`it` format and TypeScript import style.
- The project expects `apiUrl` to be the local backend, not the public `api.realworld.show` host; avoid hardcoding the public API URL in new tests unless the code specifically needs to exercise the original domain.

## Relevant repo docs

- `README.md` is the main project overview and includes the intended flow split, app targets, and reporting setup.
- `test-strategy.md` documents the self-hosted backend decision, the user pool strategy, and the rationale for API-first test data management.

## MCP

- The project-scoped VS Code MCP configuration is `.vscode/mcp.json`.
- It enables Playwright MCP for browser inspection and interaction against the Conduit UI when diagnosing selectors, navigation, authentication state, or app behavior.
- Cypress remains the test runner and source of automated coverage; use Playwright MCP as an exploratory/debugging aid, not as a replacement for Cypress specs.
