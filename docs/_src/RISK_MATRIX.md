# Risk Matrix

Scale: Likelihood and Impact rated Low / Medium / High. Severity = the combination, used to order mitigation priority (High×High is worked first).

## Task 2 scenario — mobile trading app, pre-launch

| # | Risk | Likelihood | Impact | Severity | Mitigation |
|---|---|---|---|---|---|
| 1 | Duplicate order/withdrawal from double-tap, retry, or app-kill mid-request (non-idempotent backend) | High | High | **Critical** | Idempotency keys on every money-movement call; explicit automated tests for double-submit and kill-mid-request; UI disables the action button on first tap. |
| 2 | Displayed balance drifts from the backend ledger under concurrency | Medium | High | **Critical** | Ledger reconciliation job + alerting; API contract tests asserting balance consistency after each operation; treat any drift as a Sev1. |
| 3 | No rollback/kill-switch if a money-bug ships | Medium | High | **High** | Feature-flag gate on trading/withdrawals before launch; rehearse a rollback once pre-launch. |
| 4 | iOS/Android divergence on auth/session security (biometrics, secure storage) | Medium | High | **High** | Explicit per-platform test pass on auth flows; never assume parity from one platform's result. |
| 5 | Price slippage between trade confirmation and execution shown as success | Medium | Medium | **Medium** | Explicit slippage-tolerance UX with clear error state; test the "price moved" path deliberately. |
| 6 | Session expiry mid-trade corrupts or silently drops the in-flight order | Medium | High | **High** | Test expired-token-mid-request explicitly; ensure the client re-auths without resubmitting a stale order. |
| 7 | KYC/AML or data-residency non-compliance in a launch region | Low | High | **High** | Legal sign-off gated into the release checklist before regional rollout; not a QA-only decision. |
| 8 | Network loss mid-transaction leaves the user unsure whether it succeeded | High | Medium | **High** | Deterministic post-reconnect state check (poll/query actual order status) rather than trusting the last local UI state. |
| 9 | No existing test suite means untested code paths ship silently | High | Medium | **High** | Risk-based triage (this matrix) drives day-1 manual coverage on the highest-severity rows first, before any automation exists for them. |
| 10 | Crash or performance issue only surfaces after public release (no monitoring) | Medium | Medium | **Medium** | Crash reporting + dashboards live before launch, actively watched for the first 48 hours. |

## Task 1 — trade.mb.io automation suite (secondary, operational risk)

| # | Risk | Likelihood | Impact | Severity | Mitigation |
|---|---|---|---|---|---|
| A | Target app adds/strengthens auth gating on more public routes | Medium | Medium | **Medium** | Suite already scoped to what's verifiably public today; `test.fixme` entries make future re-enablement a one-line change once/if routes reopen. |
| B | Live market data (prices, row counts) is inherently volatile | High | Low | **Low** | Assertions target structure and presence (row count > 0, price matches a currency pattern), never specific live values. |
| C | Third-party analytics/ad network calls made during page load add noise/flakiness | Low | Low | **Low** | Assertions and route interception scoped to same-origin/first-party endpoints only (`core-api.mb.io`, `/api/mbio-coins`). |
| D | CSS-module class names are regenerated on every deploy | High | Medium | **Medium** | Locators use ARIA roles, visible text, and stable app-assigned ids/attributes (`data-index`, `#trade-header-option-open-button`) instead of hashed classes. |
| E | Suite is a guest on someone else's production infrastructure - heavy local parallelism (many workers x browsers hitting trade.mb.io at once) can itself induce transient hiccups (observed once: a Trade-menu link briefly rendered with an empty `href` under a `--repeat-each=2` full-matrix run; 10/10 clean in isolation) | Medium | Low | **Low** | `retries: 2` in CI (`playwright.config.ts`) absorbs genuine transient noise; the affected assertion also waits for a non-empty href before comparing, rather than asserting instantly. Not a defect in the app or the test logic - a reminder that "the target is a live shared system" is itself a standing constraint on how hard this suite should hammer it. |
