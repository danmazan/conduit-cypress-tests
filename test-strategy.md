# Test Strategy — Cypress Portfolio Testing Project

Target UI: `https://demo.realworld.show`
Target API (original): `https://api.realworld.show/api`
Target API (current, self-hosted): `http://localhost:4000/api` — see "Target app change" below
App under test: Conduit (RealWorld spec) — a Medium.com-style social blogging app.

This document is the output of Phase 1 (Test Strategy), agreed before any test code is
written. It amends one locked decision from the project handoff (see "Amendment to
locked decisions" below) — this is called out explicitly so it isn't lost.

## Target app change (post-Phase-1 discovery)

During implementation, `https://api.realworld.show` was found to have **no durable
persistence across requests** — registered users couldn't be logged into afterward,
created resources 404'd on lookup, and duplicate registration was never rejected. This
made most of the must-have flows in this document untestable as designed (Login,
Comments, Favorites, Follow/Feed all depend on data created in one request surviving
into a later one).

**Resolution:** the target API was switched to a self-hosted backend
([`mjftw/typescript-realworld-backend`](https://github.com/mjftw/typescript-realworld-backend)),
run locally via `docker-compose`, chosen specifically because it's a drop-in,
spec-conformant implementation with real persistence and existing test coverage of
its own. The target UI (`https://demo.realworld.show`) is unchanged and still used for
all UI-layer tests — its frontend calls are hardcoded to `api.realworld.show`, so UI
tests redirect those calls to the local backend via `cy.intercept()` rather than
requiring a self-hosted frontend. This keeps the original "target a public app, don't
self-host the whole stack" decision intact for the frontend while fixing the backend's
lack of persistence.

---

## 1. Scope

### 1.1 Must-have flows (core coverage, non-negotiable)

| Flow | UI coverage | API coverage |
|---|---|---|
| Register / Login | Yes | Yes |
| Article CRUD (create/edit/delete) | Yes | Yes |
| Comments (add/delete) | Yes | Yes |
| Favorites (favorite/unfavorite, count updates) | Yes | Yes |
| Follow / Feed (follow author, personalized feed) | Yes | Yes |

All must-have flows get **full UI and API parity** — each flow is tested at both
layers rather than splitting flows into "UI-only" or "API-only" buckets.

Depth of coverage for must-have flows: **happy path + negative cases + edge cases**
(e.g. pagination boundaries within a flow, long input, duplicate values), except where
explicitly scoped down below (see 1.3).

### 1.2 Nice-to-have / stretch (priority order if time allows)

1. Pagination & tag filtering (extends article-listing tests already needed for feed/favorites)
2. Profile / Settings (update bio, image, password)
3. Global feed / article listing as a dedicated area (beyond what's already covered incidentally by other flows)

These are explicitly out of the "done" definition for the core deliverable. If the
project ships without them, that's fine — call it out in the README as documented
future work rather than treating it as incomplete.

### 1.3 Negative case scope (v1 — kept minimal on purpose)

For now, negative cases are limited to the obvious ones:

- Duplicate email / duplicate username on register
- Wrong password on login
- Empty required fields
- Invalid email format

**Resolved via backend switch — duplicate registration now enforced, with a caveat.**
The original target (`api.realworld.show`) was found during implementation to have no
durable persistence across requests at all (see "Target app change" note in the
locked decisions table above), making this and several other flows untestable.
The project switched to a self-hosted backend
([`mjftw/typescript-realworld-backend`](https://github.com/mjftw/typescript-realworld-backend),
run locally via `docker-compose`) specifically to fix this.

On the new backend, duplicate registration **is** rejected — but not exactly per the
canonical RealWorld/Conduit spec. Confirmed via manual `curl` testing:
- Status returned is **403 Forbidden**, not the spec-documented `422 Unprocessable Entity`
- Response body is `{"errors": "Email address taken"}` — a plain string, not the
  spec's `{"errors": {"email": ["has already been taken"]}}` object-of-arrays shape

This is documented as an intentional implementation choice of this specific backend,
not treated as a defect (unlike the original target's complete lack of validation).
The register spec's duplicate-email test asserts this actual behavior (403 + string
error body) rather than the spec-documented one, and is no longer skipped.

The other negative cases in this list (wrong password, empty fields, invalid email
format) have not been empirically pre-verified against the new backend — they'll be
implemented as originally planned and adjusted individually if any of them similarly
diverge from expected behavior.

**Deliberately deferred** (documented as future work, not forgotten):
- Unauthorized actions (editing/deleting another user's article, commenting without auth)
- Expired / invalid token handling

---

## 2. UI vs API split

**Philosophy: full parity.** Most must-have flows are exercised through both the UI
and the API, to demonstrate range across both testing layers rather than picking one
lane. The API layer is also used as **test setup/teardown tooling** for the UI layer
(see Section 3) — this is a separate concern from API tests-as-coverage.

---

## 3. Test data strategy

**Updated post-backend-switch.** This section originally assumed a public, shared,
hosted instance with no way to reset the database between runs (see "Target app
change" above for why that target was abandoned). The current target is a
self-hosted backend running locally via `docker-compose`, which changes what's
*possible* — the database is fully under our control and can be wiped entirely with
`docker-compose down -v` at any time — but the strategy below is **kept deliberately
unchanged in practice**, because the point of it was always to demonstrate realistic
test patterns (reusable auth state, `cy.session()` caching, ephemeral-but-cleaned-up
test resources), not to work around a constraint we no longer have. See 3.5 for what
the new capability actually gets used for.

### 3.1 Amendment to locked decisions

The original locked decision stated:

> Test data: Created via API calls, randomized/unique values per run (no
> shared/static fixtures for user accounts)

**This is amended as follows**, based on a real constraint discovered during
strategy planning: the Conduit/RealWorld API spec has **no delete-user endpoint**.
This was confirmed against the original target, and — checked directly against the
self-hosted backend's source after the switch — **is true of this backend too**
(`typescript-realworld-backend`'s user router defines register, get-current-user,
update, get-profile, and follow/unfollow only; no delete). So the amendment below
still applies technically, even though the reason it originally mattered
(unbounded, unrecoverable growth on a *public* instance) no longer does — the
database is now local and fully resettable (see 3.5).

**Amended rule:**
- **Users**: a small fixed pool (4–6 accounts) checked into
  `cypress/fixtures/users.json` with pre-agreed credentials, reused across runs.
- **Everything else** (articles, comments, favorites state created during a test)
  stays randomized per run and is torn down via API calls after each test, per the
  original intent of the locked decision.

This is kept as the deliberate pattern going forward — not because there's no
alternative anymore, but because it's the more realistic thing to demonstrate (most
real projects test against a persistent, shared environment like staging, not a
database that gets wiped every run).

### 3.2 Exception: Register-flow tests

Register tests are the one place the fixed pool doesn't apply, because register
tests exist specifically to test *account creation*. Register tests (happy path and
the duplicate-email/missing-field/invalid-email negative cases) always call
`cy.apiRegister()` with a freshly randomized username/email
(`cypressUser<timestamp><random>` / `cypress-<timestamp><random>@example.com`) —
this is deliberate, not an oversight, since the whole point of these tests is
exercising account creation itself. See 3.5 for how this data is managed
long-term.

### 3.3 User pool composition

4–6 users, differentiated by role in test scenarios:

- At least one "main" actor used across Login/Comments/Favorites/Follow tests
- At least one "other user" — needed for follow-another-user and
  comment-on-another-user's-article scenarios
- Remaining pool slots reserved for negative-case collisions (e.g. an account whose
  email/username is deliberately reused to trigger a duplicate-on-register error
  without touching an actively-in-use pool account)

Exact usernames/emails/passwords go directly into `cypress/fixtures/users.json` when
implementation starts — not needed for strategy-level agreement.

### 3.4 Articles, comments, favorites

Ephemeral, not pooled. Each test that needs an article:
1. Creates it fresh via API, authenticated as a pool user (`cy.apiCreateArticle()`)
2. Runs the actual UI or API assertions being tested
3. Deletes it via API in an `afterEach`/`after` teardown hook (`cy.apiDeleteArticle()`)

Same pattern for comments (`cy.apiAddComment()` / `cy.apiDeleteComment()`) and
favorite/unfavorite state, which is idempotent and self-cleaning by nature (favorite
→ assert → unfavorite within the same test where possible).

### 3.5 How `apiRegister`-created data is actually managed

Two distinct categories of user accounts get created via `cy.apiRegister()`, and
they're handled differently:

- **Pool users** (5 accounts, `cypress/fixtures/users.json`) — created once via the
  one-time seed spec (`cypress/e2e/_setup/seed-pool-users.cy.ts`), then reused for the
  lifetime of the local database. Not deleted between runs; the seed spec's
  login-first check means re-running it is a safe no-op once they exist.
- **Register-test throwaway accounts** (Section 3.2) — one new account per register
  test run, never cleaned up individually, same as it was on the original target.
  There is no delete-user endpoint to clean them up with, on either backend.

**What's different now**: because the database is local (`docker-compose`-managed
Postgres, inspectable directly via pgAdmin — see project setup notes), a full reset
is trivially available whenever it's actually wanted:

```bash
docker-compose down -v   # wipes the named Postgres volume entirely
docker-compose up        # fresh, empty database
```

This is **not** part of any automated test run or teardown hook — it's a manual,
occasional reset lever (e.g. before a demo, or if the local DB gets too cluttered to
navigate comfortably in pgAdmin while debugging). After a reset, the pool-user seed
spec must be re-run before any other test, since the fresh database has no users at
all. This replaces the earlier concern about "unbounded, unrecoverable growth" — it's
now bounded by how often you choose to reset, not by an external constraint.

---

## 4. Execution strategy: serial only

**Decision: tests always run fully serial — no Cypress parallelization.**

Reasoning:
- The locked architectural decision to use `cy.session()` for auth reuse assumes a
  consistent session state within a run.
- This specific hosted instance (`demo.realworld.show`) has been noted elsewhere as
  enforcing some form of session isolation behavior. The exact mechanics haven't
  been investigated in depth, but combined with `cy.session()`, running in parallel
  introduces risk that isn't worth taking on a shared, non-resettable instance.
- **Flagged as a risk to revisit**: if this becomes a real bottleneck (test suite
  gets slow), investigate the actual session isolation behavior before deciding
  whether parallelization is safe.

---

## 5. Naming conventions

### 5.1 Spec files

Gherkin-ish, feature-flow based: `<feature>-<flow>.cy.ts`

Examples:
- `register.cy.ts`
- `login.cy.ts`
- `article-crud.cy.ts`
- `comments.cy.ts`
- `favorites.cy.ts`
- `follow-feed.cy.ts`

Each lives under `cypress/e2e/ui/` or `cypress/e2e/api/` per the existing folder
structure — the folder location communicates UI vs API, so it's not repeated in the
filename.

### 5.2 Custom commands

camelCase, grouped by domain prefix (`api` / `ui`):

- `cy.apiRegister()`
- `cy.apiLogin()`
- `cy.loginBySession()` — wraps `cy.session()` for UI test setup
- `cy.apiCreateArticle()`
- `cy.apiDeleteArticle()`
- `cy.apiAddComment()`
- `cy.apiDeleteComment()`
- `cy.apiFavoriteArticle()` / `cy.apiUnfavoriteArticle()`
- `cy.apiFollowUser()` / `cy.apiUnfollowUser()`
- `cy.uiLogin()` — UI-driven login, distinct from API-driven `apiLogin` used for setup

### 5.3 Page objects

PascalCase, `Page` suffix, one class per route, with a shared `BasePage` for common
actions (navigation, generic waits, shared toast/error assertions):

- `BasePage`
- `LoginPage`
- `RegisterPage`
- `ArticlePage`
- `ArticleEditorPage`
- `SettingsPage`
- `ProfilePage`
- `HomePage` (feed/global articles/tags)

---

## 6. First custom commands to build

Per the locked architectural decisions (API-driven test data, `cy.session()` reuse),
these are built first, before any test spec:

1. `cy.apiRegister()`
2. `cy.apiLogin()`
3. `cy.loginBySession()`

These unblock every must-have flow, since all of them need an authenticated user.
`cy.apiCreateArticle()` / `cy.apiDeleteArticle()` follow shortly after, since Article
CRUD, Comments, and Favorites all depend on having an article to act on.

---

## 7. Out of scope for this document

- CI (GitHub Actions) structure — not yet set up; decide when that work actually
  starts, not now.
- Exact pool user credentials — goes directly into the fixture file at
  implementation time.
- Unauthorized-action and token-expiry negative cases — deferred per Section 1.3.

---

## 8. Definition of done for Phase 1

This document exists and is agreed. Phase 2 (implementation) starts with the three
custom commands in Section 6, then proceeds flow by flow through the must-have list
in Section 1.1, in the order: Register/Login → Article CRUD → Comments → Favorites →
Follow/Feed.
