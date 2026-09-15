# Test Plan

This repository covers two distinct testing contexts from the challenge brief. Part A is the concrete test plan behind the automation in this repo (Task 1, trade.mb.io). Part B applies the same discipline to the hypothetical scenario in Task 2 (a fintech mobile trading app two weeks from launch), since the brief's "test plan / release readiness checklist / risk matrix" deliverables sit directly under that scenario.

---

## Part A — trade.mb.io Automation (Task 1)

### 1. Objective
Provide automated, deterministic regression coverage for the public, unauthenticated surface of trade.mb.io, structured so a QA team could extend it as the product grows, without ever creating accounts or touching real user data.

### 2. Scope

**In scope** (verified against the live site, see [README > Assumptions](../README.md#assumptions--adaptations)):
- Header navigation: item visibility, link destinations, the "Trade" mega-menu, auth entry points (Log In / Sign Up).
- Responsive behaviour of the header at desktop widths (1280/1440/1920) and a mobile breakpoint (375).
- The `/markets` spot-market table: rendering, category tabs, column/data-field integrity.
- The mobile-only app-download banner (the one real "marketing banner" reachable without login).
- Negative paths: unknown routes (404), broken-link detection, mobile viewport regression, pricing-API failure handling.
- One same-origin API contract (`/cmc/v1/assets`) as bonus network validation.

**Out of scope, with reason:**
- `/` (homepage), `/trade/:pair`, `/explore/*`, `/price/:symbol` — all now require authentication. The brief explicitly forbids creating an account, so these are untestable within the rules as written.
- About Us > Why MultiBank content, and direct App Store/Google Play badge links — confirmed (via the app's own i18n bundle and routing) to live only inside that gated homepage template today. Represented in the suite as `test.fixme(...)` with the reasoning recorded inline, not faked.
- Any authenticated flow: deposits, orders, withdrawals, KYC — explicitly excluded by the brief.

### 3. Test levels
- **UI/E2E** (Playwright, real browsers) — the entire suite. No unit or component level exists because there is no application source to unit-test; this is black-box testing of a deployed product.
- **Network/contract** — one bonus suite asserting on the actual JSON response of the markets API, not just its rendered effect.

### 4. Environments
- Target: `https://trade.mb.io` (production), overridable via `BASE_URL` for a staging environment.
- Browsers: Chromium, Firefox, WebKit (desktop viewports), each a first-class Playwright project — see `playwright.config.ts`.
- Mobile is covered via explicit viewport resizing inside tests (375×667), not a separate device project, since the app's breakpoint (~1280px) is what actually drives behaviour, not device emulation specifics.

### 5. Entry / exit criteria
- **Entry:** `npm ci && npx playwright install` completes; target host responds to `/markets` with HTTP 200.
- **Exit:** `npm test` reports zero unexpected failures and zero flaky tests across all three browser projects. `test.fixme` items are expected and do not block a green run.

### 6. Tooling
Playwright Test + TypeScript, Page Object Model (`src/pages`, `src/components`), data-driven fixtures (`src/data`), GitHub Actions matrix CI (`.github/workflows/playwright.yml`).

### 7. Traceability — brief requirement → test file
| Brief category | Spec file |
|---|---|
| Navigation & Layout | `tests/navigation-layout.spec.ts` |
| Trading Functionality | `tests/trading-functionality.spec.ts` |
| Content & Links | `tests/content-links.spec.ts` |
| Negative / Edge Cases | `tests/edge-cases.spec.ts` |
| Bonus: API/network validation | `tests/api-validation.spec.ts` |

---

## Part B — Mobile Trading App Pre-Launch (Task 2 scenario)

Context: joined a fintech startup as the first QA hire; iOS + Android trading app; two weeks to public launch; no existing suite; real user funds. Full narrative reasoning is in [`TASK2_QA_STRATEGY.md`](./TASK2_QA_STRATEGY.md) — this section formalizes it into a plan.

### 1. Objective
Reach a defensible "safe to launch" state in two weeks by concentrating effort on money-correctness and account-security flows first, while establishing the minimum regression scaffolding the team can keep after launch.

### 2. Scope
- **In scope for launch gating:** funding/deposit, trade placement/execution, withdrawal, balance display accuracy, auth/session handling, KYC gate, platform parity (iOS vs Android) on all of the above.
- **In scope, lower priority:** settings, notifications, static/marketing screens, referral flows.
- **Explicitly out of scope for the 2-week window:** full localization testing, non-critical platforms (tablet layouts, web), performance/load testing beyond a sanity pass — documented as post-launch follow-ups, not silently dropped.

### 3. Test levels (pyramid)
1. **Unit** — fee calculation, balance math, rounding/precision, order validation logic. Owned by engineering, gated in CI on every commit.
2. **API/contract** — every money-movement endpoint tested directly against a sandboxed backend/ledger: happy path + negative cases (insufficient funds, expired token, duplicate/idempotent submission, market closed).
3. **E2E (UI)** — a small, curated critical-path suite (onboarding → fund → trade → withdraw → view history) run on real devices/emulators for both platforms, on one older and one current OS version.
4. **Manual exploratory** — day-one and pre-release, focused on the top 3 risk flows, performed personally before automation exists to cover them.

### 4. Environments
- iOS: current + previous major OS version, at least one physical device (not simulator-only, for biometrics/keychain behaviour).
- Android: current + previous major OS version, one physical device (fragmentation risk is higher than iOS).
- Backend: dedicated sandbox environment with a reset-able seeded ledger — never production financial systems or real funds, ever, in automated tests.

### 5. Entry / exit criteria for the launch build
- **Entry:** feature-complete build on the release branch; sandbox environment stable; crash-reporting wired up.
- **Exit (see [Release Readiness Checklist](./RELEASE_READINESS_CHECKLIST.md)):** all Sev1/Sev2 defects closed, automated suite green on both platforms, manual smoke pass complete on real devices, rollback/kill-switch verified.

### 6. Timeline against the 2-week runway
| Days | Focus |
|---|---|
| 1–2 | Manual exploratory pass on top-risk flows; inventory existing tooling/docs; align with eng on known weak spots. |
| 3–6 | API/contract tests for money-movement endpoints; start unit-test backfill with eng on critical logic. |
| 7–9 | Thin E2E suite for the critical path, both platforms; security pass (token storage, TLS pinning, logging). |
| 10–11 | Regression pass, bug triage with eng, retest fixes. |
| 12–13 | Release candidate cut; full manual smoke on real devices; release readiness checklist walkthrough. |
| 14 | Go/no-go call; staged rollout if available; first 48h monitoring plan active. |
