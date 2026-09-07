# Conduit E2E & API Test Suite (Cypress + TypeScript)

A Cypress test automation project built against the **RealWorld ("Conduit") demo
application**, showcasing end-to-end UI testing, API testing, and professional test
infrastructure practices.

> 🚧 **Status: infrastructure complete, test suite in progress.** Tooling, config, and
> reporting pipeline are set up and verified. Test strategy and spec implementation
> are the current focus — see [Roadmap](#roadmap) below.

---

## About

This project tests [RealWorld](https://demo.realworld.show) — a Medium-clone
reference application commonly used across the testing community for portfolio and
practice projects — covering both its UI and its REST API.

It's built to demonstrate practical, production-style Cypress skills rather than a
collection of one-off scripts: a maintainable architecture, sensible separation of UI
vs. API coverage, self-cleaning test data, and CI-ready reporting.

**Targets:**
- UI: `https://demo.realworld.show`
- API: `https://api.realworld.show/api`

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Cypress](https://www.cypress.io/) | Test runner / automation framework |
| TypeScript (strict mode) | Language |
| [Mochawesome](https://github.com/adamgruber/mochawesome) | HTML test reports |
| ESLint (flat config) + `eslint-plugin-cypress` | Linting, Cypress-specific best practices |
| Prettier | Code formatting |
| npm | Package management |

---

## Project Structure

```
cypress/
├── e2e/
│   ├── ui/              # UI spec files
│   └── api/              # API spec files
├── support/
│   ├── commands.ts        # Custom Cypress commands (e.g. cy.apiRegister, cy.apiLogin)
│   ├── e2e.ts               # Global support file, auto-loaded before every spec
│   └── page-objects/         # Page Object Model classes for UI tests
├── fixtures/                  # Static test data templates
└── reports/                    # Generated Mochawesome output (gitignored)

cypress.config.ts
tsconfig.json
eslint.config.js
.prettierrc
```

---

## Architecture Notes

- **Page Object Model + custom commands** — UI interactions are encapsulated in page
  object classes; reusable flows (auth, API-based setup) live in custom Cypress
  commands rather than being duplicated across specs.
- **API-first test data** — test users and content are created via direct API calls
  with randomized/unique values per run, rather than relying on shared static
  fixtures. This keeps tests independent and re-runnable without manual cleanup.
- **Session reuse** — authentication uses [`cy.session()`](https://docs.cypress.io/api/commands/session)
  to cache and restore login state across tests, avoiding redundant UI logins and
  speeding up the suite.

---

## Getting Started

### Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) (or fnm/volta)
- Node.js **v20 LTS** (see `.nvmrc`)

### Setup

```bash
git clone <this-repo-url>
cd <repo-folder>
nvm use
npm install
```

### Running tests

```bash
npm run cy:open        # interactive Cypress GUI
npm run cy:run          # headless run
npm run test              # headless run + generates HTML report
```

The HTML report is generated at `cypress/reports/html/index.html` after `npm run test`.

### Linting & formatting

```bash
npm run lint
npm run format
```

---

## Roadmap

- [x] Project scaffolding, TypeScript config, folder structure
- [x] Mochawesome HTML reporting pipeline
- [x] ESLint + Prettier
- [x] Test strategy doc (flow coverage, UI vs API split, naming conventions)
- [x] Custom commands: `cy.apiRegister()`, `cy.apiLogin()`, `cy.loginBySession()`
- [ ] UI test suite: registration, login, article CRUD, comments, favorites, follow/feed
- [ ] API test suite: same flows, API-level
- [ ] GitHub Actions CI pipeline
- [ ] Published Mochawesome report as a CI artifact / GitHub Pages

---
